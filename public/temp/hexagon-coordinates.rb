require 'rubygems'
require 'RMagick'

N = 350
SIZE = 60
Colors = %w(black white blue cyan green yellow red magenta)

image = Magick::Image.new(N, N) { self.background_color = 'white' }

def triangle_pixel col, row
  # (col / 100 + row / 100) % 8  # checkerboard
  # ((col - N/2) ** 2 + (row - N/2) ** 2) ** 0.5 / 20 % 2  # dartboard
  col = col - row * (Math.tan(Math::PI / 6))
  row = row / Math.cos(Math::PI / 6)
  parity = row % SIZE > -col % SIZE ? 1 : 0
  x = col.to_i / SIZE
  y = row.to_i / SIZE
  # (x + y + parity) % 6
  # x % 8
  # Magick::Pixel.from_color(Colors[parity])
  Magick::Pixel.from_hsla(x % 360, 100, parity * 100)
  # Magick::Pixel.from_hsla(1, 100, parity * 100)
end

PERFECT_HEXAGON = Math.sqrt(3) / 2

PIXEL_FROM_COLOR = Hash.new do |h, color|
  h[color] = Magick::Pixel.from_color color
end

def pixel col, row
  # coordinates offset; puts (0,0) in the middle
  col -= N/2
  row -= N/2  # row offset
  
  row_height = N/4  # configure this!
  col_width = (row_height * PERFECT_HEXAGON).round
  hex_col = col / col_width  # column size factor
  row -= row_height / 2 if hex_col % 2 == 1  # odd row offset
  hex_row = row / row_height  # row size factor
  
  # rectangle to hexagon magic
  x = col % col_width   # x inside the rectangle, from left
  y = row % row_height  # y inside the rectangle, from top
  w = (col_width * 2.0/3).ceil
  if x >= w
    x -= w
    fac = (row_height / 2.0) / (col_width - w)
    if x > (y / fac)
      hex_col += 1
      hex_row -= 1 if hex_col % 2 == 1
    end
    if x >= (row_height - y) / fac
      hex_col += 1
      hex_row += 1 if hex_col % 2 == 0
    end
  end
  
  parity = (hex_col % 2 * 2 + hex_row % 2)  # checkerboard
  color = %w(#eee #ccc #aaa #999)[parity]  # color
  color = 'red' if hex_col == 0 && hex_row == 0  # current hexagon
  
  PIXEL_FROM_COLOR[color]  # draw
end

srand 1
pixels = []
N.times do |y|
  N.times do |x|
    pixels << pixel(x, y)
  end
end
image.store_pixels(0, 0, N, N, pixels)

image.scale(1).display
