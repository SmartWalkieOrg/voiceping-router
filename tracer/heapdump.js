// Taken from https://gist.github.com/danielkhan/0a98ae0ae2b5ddfd443e

'use strict'

/**
 * Simple userland heapdump generator using v8-profiler
 * Usage: require('./tracer/heapdump').init('datadir')
 *
 * @module HeapDump
 * @type {exports}
 */

var fs = require('fs')
var profiler = require('v8-profiler')
var _datadir = null
var nextMBThreshold = 0

/**
 * Saves a given snapshot
 *
 * @param snapshot Snapshot object
 * @param datadir Location to save to
 */
function saveHeapSnapshot(snapshot, datadir) {
  var buffer = ''
  var stamp = Date.now()
  snapshot.serialize(
    function iterator(data, length) {
      buffer += data
    },
    function complete() {
      var name = stamp + '.heapsnapshot'
      fs.writeFile(datadir + '/' + name, buffer, function () {
        console.log('Heap snapshot written to ' + name)
      })
    }
  )
}

/**
 * Creates a heap dump if the currently memory threshold is exceeded
 */
function heapDump() {
  var memMB = process.memoryUsage().rss / 1048576

  console.log(memMB + '>' + nextMBThreshold)

  if (memMB > nextMBThreshold) {
    console.log('Current memory usage: %j', process.memoryUsage())
    nextMBThreshold += 50
    var snap = profiler.takeSnapshot('profile')
    saveHeapSnapshot(snap, _datadir)
  }
}

/**
 * Schedule a heapdump by the end of next tick
 */
function tickHeapDump() {
  setImmediate(function () {
    heapDump()
  })
}

/**
 * Init and scheule heap dump runs
 *
 * @param datadir Folder to save the data to
 */
module.exports.init = function (datadir) {
  _datadir = (process.cwd() + '/' + datadir)
  fs.exists(_datadir, function(exists) {
    if (!exists) {
      fs.mkdir(_datadir, function() {
      })
    }
  })
  setInterval(tickHeapDump, 500)
}
