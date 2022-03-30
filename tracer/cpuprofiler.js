// taken from: https://gist.github.com/danielkhan/9cfa77b97bc7ba0a3220

'use strict'

/**
 * Simple userland CPU profiler using v8-profiler
 * Usage: require('./tracer/cpuprofiler').init('datadir')
 *
 * @module CpuProfiler
 * @type {exports}
 */

var fs = require('fs')
var profiler = require('v8-profiler')
var pusage = require('pidusage')

var _datadir = null

/**
 * Stops the profiler and writes the data to a file
 * @param id the id of the profiler process to stop
 */
function stopProfiling(id) {
  var profile = profiler.stopProfiling(id)
  fs.writeFile(_datadir + '/' + id + '.cpuprofile', JSON.stringify(profile), function () {
    console.log('Profiler data written')
  })
}

/**
 * Starts profiling and schedules its end
 */
function startProfiling() {

  pusage.stat(process.pid, function(err, stat) {
    // console.log('Pcpu: %s', stat.cpu)
    // console.log('Mem: %s', stat.memory)

    if (!!process.env.CPU_TRACER_TRESHOLD && Number(stat.cpu) >= Number(process.env.CPU_TRACER_TRESHOLD)) {
      var stamp = Date.now()
      var id = '' + stamp

      // Use stdout directly to bypass eventloop
      // fs.writeSync(1, 'Start profiler with Id [' + id + ']\n')

      // Start profiling
      profiler.startProfiling(id)

      // Schedule stop of profiling in x seconds
      setTimeout(function () {
        stopProfiling(id)
      }, 5 * 1000)
    }
  })
}

/**
 * Init and schedule profiler runs
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

  setInterval(startProfiling, 30 * 1000)
}
