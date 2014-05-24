require 'redcloth'

TEX_PATTERN = /\$(\$)?(\{[^\}]+\})?(\S[^\$]*)\$\$?/
QUALITY = 1

math_textile = ARGF.read

IMAGE_PREFIX = 'temp'
TEX_TEMPLATE = <<'TEX_DOCUMENT'
\documentclass{scrartcl}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}  % math...
\usepackage{pxfonts}  % \mathbb
\begin{document}
\pagestyle{empty}  % no page number
<TEX>
\end{document}
TEX_DOCUMENT

def generate_image tex, image_file_name
  File.open image_file_name + '.tex', 'w' do |file|
    file.puts TEX_TEMPLATE.sub('<TEX>', tex)
  end
  `latex2png -s #{115 * QUALITY} #{image_file_name}.tex`
  `rm #{image_file_name}.tex`
end

textile = math_textile.gsub(TEX_PATTERN) do
  big, styles, tex = $1, $2 || '{}', $3
  if big
    tex = "\\[#{tex}\\]"
  else
    tex = "$#{tex}$"
  end
  image_file_name = "temp-#{tex.hash.%(2**32).to_s(16)}"
  unless File.exist?(image_file_name + '.png')
    generate_image tex, image_file_name
  end
  width = `file #{image_file_name}.png`[/(\d+) x /, 1].to_i
  styles.sub!('{', "{vertical-align: middle; width: #{width / QUALITY}px; ")
  "!#{styles}#{"file://#{Dir.pwd}/" if ENV['TM_FILEPATH']}#{image_file_name}.png(#{tex.tr '()', '[]' })!"
end

puts RedCloth.new(textile).to_html