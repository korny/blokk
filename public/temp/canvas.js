var fps = 25;
function draw() {
  var canvas = document.getElementById('canvas');
  if (!canvas.getContext) return;
  ctx = canvas.getContext('2d');
  ctx.scale(3, 3)
  var rotationOffset = 0;
  var frame = 0;
  setInterval(function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(100 + 20 * Math.sin(frame * 0.01), 100 + 20 * Math.cos(frame * 0.03));
    for (i = 1; i < 6; i++){ // Loop through rings (from inside to out)
      ctx.save();
      ctx.fillStyle = 'rgb('+(51*i)+','+(255-51*i)+',255)';
      ctx.strokeStyle = 'rgb(0,0,' + 51*i + ')';
      ctx.rotate(rotationOffset);
      for (j = 0; j < i*6; j++){ // draw individual dots
        ctx.rotate(Math.PI*2/(i*6));
        ctx.beginPath();
        ctx.arc(0,i*12.5,5,0,Math.PI*2,true);
        ctx.fill();
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0,i*12.5,5,0,Math.PI*2,true);
        ctx.stroke();
      }
      ctx.restore();
    }
    frame++;
    rotationOffset += 0.03 * Math.sin(frame * 0.02);
    ctx.restore();
  }, 1000 / fps);
}

