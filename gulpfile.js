"use strict";

var gulp = require("gulp");
var eslint = require("gulp-eslint");
var plugins = require("gulp-load-plugins")();

var paths = {
  lint: ["./gulpfile.js", "./app.js", "./runServer.js", "./lib/*.js", "./tracer/*.js"],
  watch: ["./gulpfile.js", "./**/*.js"],
  tests: ["./test/specs/*.js"],
  source: ["./**/*.js"]
};

var plumberConf = {};

if (process.env.CI) {
  plumberConf.errorHandler = (err) => {
    throw err;
  };
}

gulp.task("lint", () => {
  return gulp.src(paths.lint)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task("istanbul", (cb) => {
  gulp.src(paths.source)
    .pipe(plugins.istanbul()) // Covering files
    .on("finish", () => {
      gulp.src(paths.tests)
        .pipe(plugins.plumber(plumberConf))
        .pipe(plugins.mocha())
        .pipe(plugins.istanbul.writeReports()) // Creating the reports after tests runned
        .on("finish", () => {
          process.chdir(__dirname);
          cb();
        });
    });
});

gulp.task("bump", ["test"], () => {
  var bumpType = plugins.util.env.type || "patch"; // major.minor.patch

  return gulp.src(["./package.json"])
    .pipe(plugins.bump({ type: bumpType }))
    .pipe(gulp.dest("./"));
});

gulp.task("watch", ["test"], () => {
  gulp.watch(paths.watch, ["test"]);
});

gulp.task("test", ["lint"], (done) => {
  require("child_process").spawn("npm", ["test"], { stdio: "inherit" })
    .on("close", (e) => {
      if (e) {
        // process.exit(e);
        throw e;
      }
      done();
    });
});

gulp.task("release", ["bump"]);

gulp.task("default", ["test"]);

gulp.task("develop", () => {
  plugins.nodemon({
    script: "app.js",
    ext: "html js",
    ignore: ["ignored.js"],
    env: { "NODE_ENV": "development", "DEBUG": "*", "NUM_CLUSTER": 1 }
  })
    .on("change", ["lint"])
    .on("restart", () => {
      console.log("restarted!");
    });
});

gulp.task("changelog", () => {
  var stream = require("stream");
  var readable1 = stream.Readable;
  var readable = readable1();
  require("conventional-changelog")({
    repository: require("./package.json").repository.url,
    version: require("./package.json").version
  }, (err, log) => {
    if (err) {
      throw err;
    }
    readable.push(new Buffer(log));
    readable._read = () => {};

    var changelog = require("fs").createWriteStream("./CHANGELOG.md");
    readable.pipe(changelog);

    console.log("Written changelog!", log);
  });
});
