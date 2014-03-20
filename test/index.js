var expect = require('expect.js');
var _ = require('../');
var clone = require('clone');
var Promise = require('promise');
var isPromise = require('is-promise');

/*

TODO
==============
- angular support

* return a promise instead
* parallel and series all that need to be

utilities
=====================

collections
===================
- where
- findWhere
- reject
- every
- some
- contains
- max
- min
- sortBy
- indexBy
- countyBy

Objects
==============================
- keys
- values
- extend
- defaults
- pick
- omit

 */
 

describe('basic promising', function () {
  
  it('creates promises', function (done) {
    var promise1 = _.promise();
    expect(isPromise(promise1)).to.equal(true);
    
    var promise2 = _.asPromise(123);
    promise2.then(function (val) {
      expect(val).to.equal(123);
      done();
    }, done).done();
  });
  
  it('resolves when all promises resolve', function (done) {
    _.all([_.asPromise(123), _.asPromise(456)]).then(function (values) {
      expect(values[0]).to.equal(123);
      expect(values[1]).to.equal(456);
      done();
    }).done();
  });
  
  it('partially applies functions and arguments', function (done) {
    var activity = function (arg1, arg2) {
      expect(arg1).to.equal('arg1');
      expect(arg2).to.equal('arg2');
      done();
    };
    
    var doThis = _.partial(activity, 'arg1');
    doThis('arg2');
  });
  
  it('calls a method with an object of arguments', function (done) {
    var promise = _.promise(function (resolve) {
      resolve({
        key: 'value'
      });
    });
    
    _.pluck({
      fn: 'key',
      promises: promise
    }).then(function (val) {
      expect(val).to.eql(['value']);
      done();
    }, done).done();
  });
  
  
  it('customizes the order of each method argument passed to the method', function (done) {
    _.promiseFirst();
    
    var promise = _.promise(function (resolve) {
      resolve({
        key: 'value'
      });
    });
    
    _.pluck(promise, 'key').then(function (val) {
      expect(val).to.eql(['value']);
    }, done).done(function () {
      _.functionFirst();
      done();
    });
  });
  
  it('#identity()', function (done) {
    var arg = _.identity(_.asPromise(123));
    arg.then(function (val) {
      expect(val).to.equal(123);
      done();
    });
  });
  
  it('#boolean()', function () {
    var bool = _.boolean('string');
    
    bool.then(function (val) {
      expect(bool).to.strictEqal(true);
      done();
    });
  });
  
  it('turns non promise arguments into promises', function (done) {
    var partialMap = _.map(_.identity);
    var fullMap = _.map(_.identity, [4,5,6]);
    
    _.all(partialMap([1,2,3]), fullMap).then(function (results) {
      expect(results[0]).to.eql([1,2,3]);
      expect(results[1]).to.eql([4,5,6]);
      done();
    }).done();
  });
  
  it('chains multiple promises', function (done) {
    var promises = [
      _.promise(function (resolve) {
        resolve('a');
      }),
      _.asPromise('b'),
      _.asPromise('c')
    ];
    
    var dash = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve('-' + letter + '-');
        }, reject);
      });
    });
    
    var find = _.find(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve(letter === '-a-');
        });
      });
    });
    
    var yell = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (letter) {
          resolve(letter + '!!!');
        });
      });
    });
    
    dash(promises)
      .then(find)
      .then(yell)
      .then(function (result) {
        expect(result).to.eql(['-a-!!!']);
        done();
      }).done();
  });
  
  it('composes multiple promise methods', function (done) {
    var map = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve('0' + val);
        });
      });
    });
    var find = _.find(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve(val === '0123');
        });
      });
    });
    var yell = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve(val + '!');
        });
      });
    });
    var reverse = _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          var arr = val.split('');
          resolve(arr.reverse().join(''));
        });
      });
    });
    var weird = _.compose(yell, reverse, find, map);
    
    weird([
      _.asPromise(123),
      _.asPromise(456)
    ]).then(function (results) {
      expect(results[0]).to.equal('3210!');
      done();
    }).done();
  });
  
});

describe('arrays', function () {
  
  it('#each()', function (done) {
    var iterator = 0;
    
    var promises = [
      Promise.from(123),
      Promise.from(456)
    ];
    
    var iterate = _.each(function (promise, resolve, reject, idx) {
      iterator += 1;
      return promise;
    });
    
    iterate(promises).then(function () {
      expect(iterator).to.equal(2);
      done();
    }).done();
  });
  
  it('#eachSeries()', function (done) {
    var called123 = false;
    var called456 = false
    var promise123 = _.promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(123);
      }, 0);
    });
    var promise456 = _.asPromise(456);
    
    _.eachSeries(function (promise, idx) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          if (val == 123) {
            called123 = true;
            expect(called456).to.equal(false);
          }
          
          if (val == 456) {
            called456 = true;
            expect(called123).to.equal(true);
          }
          
          resolve();
        }).done();
      });
    }, [promise123, promise456]).then(function () {
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('#map()', function (done) {
    var promises = [
      Promise.from(123),
      Promise.from(456)
    ];
    
    _.map(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          resolve(val +1);
        });
      });
    }, promises).then(function (res) {
      expect(res).to.eql([124, 457]);
      done();
    }).done();
  });
  
  it('#mapSeries', function (done) {
    var called123 = false;
    var called456 = false;
    
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456)
    ];
    
    _.mapSeries(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (val) {
          if (val === 123) called123 = true;
          if (val === 456) called456 = true;
          
          if (val === 456) {
            expect(called123).to.equal(true);
          }
          
          resolve(val +1);
        });
      }, done);
    }, promises).then(function (res) {
      expect(res).to.eql([124, 457]);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('#reduce()', function (done) {
    var promises = [
      Promise.from('a'),
      Promise.from('b'),
      Promise.from('c')
    ];
    
    // Adds all the numbers in the promises together
    _.reduce(function (prevPromise, currPromise) {
      return _.promise(function (resolve) {
        Promise.all(prevPromise, currPromise).then(function (res) {
          resolve(res.reduce(function (memo, val) {
            return memo + val;
          }));
        });
      });
    }, promises).then(function (result) {
      expect(result).to.equal('abc');
      done();
    }).done();
  });
  
  it('#reduceRight()', function (done) {
    var promises = [
      Promise.from('a'),
      Promise.from('b'),
      Promise.from('c')
    ];
    
    // Adds all the numbers in the promises together
    _.reduceRight(function (prevPromise, currPromise) {
      return _.promise(function (resolve) {
        Promise.all(prevPromise, currPromise).then(function (res) {
          resolve(res.reduce(function (memo, val) {
            return memo + val;
          }));
        });
      });
    }, promises).then(function (result) {
      expect(result).to.equal('cba');
      done();
    }).done();
  });
  
  it('#filter()', function (done) {
    var promises = [
      Promise.from(123),
      Promise.from(456),
      Promise.from(789)
    ];
    
    _.filter(function (promise, idx) {
      return _.promise(function (resolve) {
        promise.then(function (num) {
          resolve(num < 200);
        });
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(123);
      done();
    }).done();
  });
  
  it('#filterSeries()', function (done) {
    var called123 = false;
    var called456 = false;
    var promises = [
      _.promise(function (resolve) {
        setTimeout(function () {
          resolve(123);
        }, 0);
      }),
      _.asPromise(456)
    ];
    
    _.filterSeries(function (promise, idx) {
      return _.promise(function (resolve) {
        promise.then(function (num) {
          if (num == 123) called123 = true;
          if (num == 456) called456 = true;
          
          if (num == 456) {
            expect(called123).to.equal(true);
          }
          
          resolve(num < 200);
        }).done();
      });
    }, promises).then(function (res) {
      expect(res.length).to.equal(1);
      expect(res[0]).to.equal(123);
      expect(called123).to.equal(true);
      expect(called456).to.equal(true);
      done();
    }).done();
  });
  
  it('find', function (done) {
    var promises = [
      Promise.from(123),
      Promise.from(456),
      Promise.from(789)
    ];
    
    _.find(function (promise) {
      return _.promise(function (resolve, reject) {
        promise.then(function (num) {
          resolve(num < 200);
        }, reject);
      });
    }, promises).then(function (res) {
      expect(res).to.equal(123);
      done();
    }).done();
  });
  
  it('#findSeries')
  
  // (remove all falsey values)
  it('#compact()', function (done) {
    var promises = [
      _.asPromise(123),
      _.asPromise(false),
      _.asPromise(null),
      _.asPromise(456),
      _.asPromise(undefined)
    ];
    
    _.compact(promises).then(function (values) {
      expect(values).to.eql([123, 456]);
      done();
    }).done();
  }); 
  
  it('#first()');
  it('#initial()');
  it('#last()');
  it('#rest()');
  
});

describe('collections', function () {
  
  it('pluck', function (done) {
    var promise1 = new Promise(function (resolve, reject) {
      resolve({
        key1: 'promise1value1',
        key2: 'promise1value2'
      });
    });
    
    var promise2 = new Promise(function (resolve, reject) {
      resolve({
        key1: 'promise2value1',
        key2: 'promise2value2'
      });
    });
    
    _.pluck('key1', [promise1, promise2]).then(function (val) {
      expect(val).to.eql(['promise1value1', 'promise2value1']);
      done();
    }).done();
  });
  
});
