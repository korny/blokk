%w(camping camping/session coderay coderay/for_redcloth ./feed).each { |lib| require lib }

Camping.goes :Blokk

# TODO: fix Textile (produces improper HTML at times, < for example)
module Blokk
  VERSION = "1.0"
  PAGE_URL = 'http://murfy.de'
  
  set :secret, `openssl rand -hex 32`
  include Camping::Session
  
  module Models
    class Admin < Base; end
    
    class Post < Base
      has_many :comments, -> { order 'created_at ASC' }
      validates_presence_of :title, :nickname
      validates_uniqueness_of :nickname
      def self.find_by_id_or_nickname id
        where('id = ? OR nickname = ?', id, id).first
      end
    end
    
    class Comment < Base
      belongs_to :post
      validates_presence_of :username
      validates_length_of :body, :within => 1..3000
      validates_inclusion_of :bot, :in => %w(K)
      validates_associated :post
      attr_accessor :bot
    end
    
    class CreateTheBasics < V 1.0
      def self.up
        create_table Admin.table_name do |table|
          table.string :name, :password
        end
        print "Password for #{user = ENV['USER']}? "
        Admin.create :name => user, :password => $stdin.gets.chomp
        
        create_table Post.table_name do |table|
          table.string :title, :tags, :nickname
          table.text :body
          table.timestamps
        end
        
        create_table Comment.table_name do |table|
          table.integer :post_id
          table.string :username
          table.text :body
          table.datetime :created_at
        end
      end
    end
  end
  
  Models::Base.establish_connection(:adapter => 'sqlite3', :database => './murfy.db')
  Models.create_schema
  
  module Helpers
    def logged_in?
      @state.logged_in
    end
    
    def login name, password
      if logged_in? == nil
        @state.logged_in = Models::Admin.where(name: name, password: password).exists?
      end
    end
    
    def logout
      @state.logged_in = nil
    end
    
    def toolbar target = nil
      if target
        for role, submenu in toolbar[target].sort_by { |k, v| [:visitor, :admin].index k }
          ul.menu.send(role) do
            submenu.each do |x|
              li { x[/\A\w+\z/] ? a(x, :href => '#') : x }
            end
          end unless submenu.empty?
        end
      else
        @toolbar ||= Hash.new { |h, k| h[k] = { :visitor => [], :admin => [] } }
      end
    end
    
    # shortcut for error-aware labels
    def label_for name, record = nil, attr = name, options = {}
      errors = record && !record.body.blank? && !record.valid? && record.errors[attr]
      label name.to_s, { :for => name }, options.merge(errors ? { :class => :error } : {})
    end
    
    def tags
      Models::Post.pluck(:tags).uniq.join(' ').strip.split(/\s+/).uniq
    end
    
    def slogan
      Models::Post.find_by_nickname('slogan').body rescue ''
    end
  end
  
  module Mab
    include ::Mab::Indentation
    alias :mab_done_without_super :mab_done
    def mab_done(*args)
      mab_done_without_super(*args)
      super
    end
  end
  
  TAG_PATTERN = ["tags LIKE '% TAG %", 'TAG %', '% TAG', "TAG'"].join("' OR tags LIKE '")
  
  module Controllers
    class Index < R '/', '/index', '/tag/()([-\w]*)', '/all()()', '/(rss)', '/(rss)/([-\w]+)'
      def get format = 'html', tag = 'Index'
        @posts = Post.where(TAG_PATTERN.gsub('TAG', tag || '')).order('created_at DESC').all
        if format == 'rss'
          @comments = Comment.order('created_at DESC').includes(:post).all if tag == 'comments'
          rss = ::RSS.feed :title => "(almost) murphy.de#{' - comments' if @comments}",
            :about => "#{PAGE_URL}/rss", :link => PAGE_URL,
            :description => 'Kornelius Kalnbach @ Berlin, Germany',
            :image => ["#{PAGE_URL}/raven.png", '(almost) murphy.de'] do |feed|
            for item in @comments || @posts.select { |p| p.tags[/\bIndex\b/] }
              post = @comments ? item.post : item
              feed.item :title => post.title, :link => self / "/read/#{post.nickname}",
                :date => item.created_at, :author => (item.username if @comments),
                :description => @comments ? item.body : RedCloth.new(item.body.sub(/^---+/, '')).to_html
            end
          end
          r 200, rss.to_s, 'Content-Type' => 'application/rss+xml; charset=UTF-8'
        else
          @tag = tag
          render :index
        end
      end
    end
    
    module Poster
      def post id = nil
        return unless logged_in?
        @post = id.blank? ? Post.new : Post.find(id)
        @post.update_attributes @input
        return redirect Read, @post.nickname if @post.valid?
        render @post.new_record? ? :new : :edit
      end
    end
    
    class New < R '/new', '/new/([-\w]*)'
      def get tag = nil
        @post = Post.new tags: "Index #{tag}".strip, nickname: @input.nickname if logged_in?
        render :new
      end
      include Poster
    end
    
    class Edit < R '/edit/([-\w]+)', '/edit'
      def get id
        @post = Post.find_by_id_or_nickname id if logged_in?
        render :edit
      end
      include Poster
    end
    
    class Delete < R '/delete/([-\w]+)', '/delete'
      def get id
        @post = Post.find_by_id_or_nickname id if logged_in?
        render :delete
      end
      def post
        (@post = Post.find(@input['id'])).destroy if logged_in?
        redirect Index
      end
    end
    
    class Shoot < R '/shoot/(\d+)'
      def get comment_id
        return unless logged_in?
        (comment = Comment.find(comment_id)).destroy
        redirect self / "/read/#{comment.post.nickname}?#comments"
      end
    end
    
    class Login < R '/login'
      def get
        logout; render(:login)
      end
      
      def post
        login @input.name, @input.password
        logged_in? ? redirect(@env["HTTP_REFERER"].chomp('login') || Index) : get
      end
    end
    
    class Logout < R '/logout'
      def get
        logout; redirect(Index)
      end
    end
    
    # Lowest precedence to allow urls like /<nickname>
    class Read < R '/read/([-\w]+)', '/([-\w]+)'
      def get id  # read article
        @post = Post.find_by_id_or_nickname id
        @comment = Comment.new :username => @input.name
        @post ? render(:view) : logged_in? ? redirect(New, nickname: id) : redirect('404.gif')
      end
      def post id  # post comment
        @comment = Comment.create :post_id => id, :bot => @input.bot,
          :username => (name = @input.name), :body => @input.comment
        redirect self / "/read/#{Post.find(id).nickname}?name=#{Rack::Utils.escape name}#comments"
      end
    end
  end
  
  module Views
    def layout
      html do
        head do
          meta :'http-equiv' => 'Content-Type', :content => 'text/html; charset=utf-8'
          title "(almost) murphy.de#{" - #{@post.title}" if @post}"
          link :rel => 'stylesheet', :type => 'text/css', :href => self / '/main.css'
          link :rel => 'alternate', :type => 'application/rss+xml', :href => "/rss#{"/#@tag" if @tag != 'Index'}"
          link :rel => 'alternate', :type => 'application/rss+xml', :href => "/rss/comments"
          link :rel => 'shortcut icon', :type => 'image/x-icon', :href => '/murfy32.png'
        end
        body do
          div.header! do
            h1 { a(:href => R(Index), :accesskey => 'I') { sup('(almost)'); span('murphy.de') } }
            toolbar[:top][:visitor] = tags.sort.map { |t| a(t, :href => self / "/tag/#{t}").to_s }
            toolbar[:top][:admin] << a('New', :href => self / "/new#{"/#@tag" if @tag != 'Index'}").to_s
            toolbar[:top][:admin] << a('Logout', :href => R(Logout)).to_s if logged_in?
            div.bar! { toolbar :top }
          end
          div.slogan { RedCloth.new(slogan).to_html }
          div.content { self << yield }
          div.footer! do
            a("blokk #{VERSION}", :href => 'http://murfy.de/read/blokk')
            text(' | ')
            a("contact", :href => '/contact')
            a.C! 'C', :href => 'http://camping.io', :title => 'powered by Camping'
          end
        end
      end
    end
    
    def index
      p { a('Log in', :href => R(Login)).to_s + ' to create posts.' } if @posts.empty?
      @posts.each { |post| _post post }
    end
    
    def login
      logged_in? ? yield : _login_form
    end
    
    def new
      login { _post_form @post, R(New) }
    end
    
    def edit
      login { _post_form @post, R(Edit) + "/#{@post.id}" }
    end
    
    def delete
      login do
        p { text! 'Really delete %s?' % a(@post.title, :href => R(Read, @post.id)) }
        form :action => R(Delete), :method => :post do
          input :type => :hidden, :name => :id, :value => @post.id
          input :type => :submit, :value => 'Delete'
        end
      end
    end
    
    def view
      _post @post, true
      
      # comments
      h2 'Say something! / Sag was!', :id => 'comments'
      for c in @post.comments
        div.comment do
          pre.body c.body
          timestamp = c.created_at.strftime('%H:%M on %A, %Y-%m-%d')
          div.username "#{c.username} @ #{timestamp}"
          a 'Delete', :href => R(Shoot, c), :onclick => "return confirm('Sure?');" if logged_in?
        end
      end
      
      form :action => R(Read, @post), :method => :post do
        div do
          label_for :name, @comment, :username, :accesskey => 'C'
          input.name! :name => :name, :value => @comment.username, :size => 41, :type => :text
        end
        div do
          label_for :comment, @comment, :body
          textarea.comment! '', :name => :comment, :cols => 60, :rows => 10
          input.bot! :type => :hidden, :name => :bot, :value => 'spambot'
          p 'No markup, just plain monospace text. / Kein Markup, nur Normschrift-Klartext.'
          input :type => :submit, :value => 'Post! / Abschicken!',
            :onclick => "getElementById('bot').value='K'"
        end
      end
    end
    
    # Partials
    def _post post, full = false, id = post.nickname || post.id
      div.post do
        div.title { a post.title, :href => self / "/read/#{id.gsub(/ä|ö|ü/, '')}" }
        div.subtitle do
          text "#{post.created_at.strftime('%a %Y-%m-%d')} "
          text! '( %s )' % post.tags.scan(/[a-z][-\w]+/i).map { |t|
            a(t[0,2], :title => t, :href => R(Index, t)).to_s
          }.join(' ')
        end
        excerpt, body = *post.body.split(/^---+/, 2)
        div.body { text! RedCloth.new("#{excerpt}#{body if full}").to_html }
        div.more { a('Read... / Lesen...', :href => self / "/read/#{id.gsub(/ä|ö|ü/, '')}") } if body && !full
        cs = post.comments.size
        toolbar[id][:visitor] <<
          a("#{cs} comment#{'s' unless cs == 1}", :href => self / "/read/#{id.gsub(/ä|ö|ü/, '')}").to_s
        toolbar[id][:admin] <<
          a('Edit', :href => self / "/edit/#{id.gsub(/ä|ö|ü/, '')}", :accesskey => ('E' if full)).to_s <<
          a('Delete', :href => self / "/delete/#{id.gsub(/ä|ö|ü/, '')}").to_s
        toolbar id
      end
    end
    
    def _login_form
      form :action => R(Login), :method => :post do
        div do
          label_for :name
          input :name => :name, :type => :text
        end
        div do
          label_for :password
          input :name => :password, :type => :password
          input :type => :submit, :name => :login, :value => 'Login'
        end
      end
    end
    
    def _post_form post, action
      form :method => :post, :action => action do
        div do
          label_for :title, post
          input.title! :name => :title, :type => :text, :size => 81, :value => post.title
        end
        div do
          label_for :body, post
          textarea.body! post.body, :name => :body, :cols => 80, :rows => 30, :accesskey => 'B'
        end
        div do
          label_for :nickname, post
          input.nickname! :name => :nickname, :type => :text, :size => 81, :value => post.nickname
          label_for :tags, post, :tags, :accesskey => 'T'
          input.tags! :name => :tags, :type => :text, :size => 81, :value => post.tags
          input :type => :hidden, :name => :id, :value => post.id
          input :type => :submit, :value => 'Save', :accesskey => 'S'
        end
      end
    end
  end
end
