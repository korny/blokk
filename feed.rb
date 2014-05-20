require 'rss'

module RSS
  
  class MakerProxy < Struct.new :maker
    def item options
      maker.items.new_item do |item|
        options.each { |key, value| item.send :"#{key}=", value }
      end
    end
  end
  
  def self.feed options
    image = options.delete(:image)
    Maker.make options.delete(:version) || '2.0' do |maker|
      options.each { |key, value| maker.channel.send :"#{key}=", value }
      maker.items.do_sort = true
      maker.image.title = image[1]
      maker.image.url = image[0]
      yield MakerProxy.new(maker)
    end
  end
  
end