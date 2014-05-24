document.setTitle = function(text) {
  this.title = this.originalTitle + text;
}
document.originalTitle = document.title;

DrawEngine = {
  
  initialize: function() {
    setInterval(this.fps, 1000);
  },
  
  fps: (function() {
    function fps() {
      var text = ' - ';
      for (taskName in fps.frames) {
        var frames = fps.frames[taskName];
        text += taskName + ': ' + (frames.count - frames.skipped)
          + '/' + frames.count + ' fps ';
        frames.count = 0;
        frames.skipped = 0;
      }
      // if (fps.max) text += ' (of ' + fps.max + ')';
      document.setTitle(text + fps.info);
    }
    fps.frames = [];
    fps.max = 30;
    fps.info = '';
    fps.pause = false;
    return fps;
  })(),
  
  startLoop: function(name, callback, maxFPS) {
    var fps = this.fps;
    if (!maxFPS) maxFPS = fps.max;
    var frames = {
      name: name, maxFPS: maxFPS, callback: callback,
      index: 0, count: 0, skipped: 0
    };
    fps.frames[name] = frames;
    setInterval(function() {
      if (fps.pause || frames.count >= frames.maxFPS) return;
      if (frames.callback(frames.index++, frames) === 'skipped') frames.skipped++;
      frames.count++;
    }, 1000 / maxFPS);
  }
  
};