// random numbers
var Random = (function() {
  var generator = new MersenneTwister19937;  // initialization is slow!
  var random = {
    init: function(seed) {
      generator.init_genrand(seed);
    },
    nextFraction: function() {
      return generator.genrand_real2();
    },
    next: function(n) {
      return Math.floor(this.nextFraction() * n);
    },
    nextInRange: function(min, max) {
      return min + this.nextFraction() * (max - min);
    },
    nextColor: function() {
      return 'rgb(' +
        this.next(255) + ',' +
        this.next(255) + ',' +
        this.next(255) + ')';
    },
    nextElement: function(array) {
      return array[this.next(array.length)];
    }
  };
  random.init(0);
  return random;
})();
