try {
  var config = require('./config');
} catch (e) {
  logFatal('Missing config file config.js');
  process.exit(1);
}

const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const fs = require('fs');
const path = require('path');
const os = require('os');

const fsp = require('fs-p');
const WaitGroup = require('waitgroup');

async function inkscapeExport(sourcePath, destinationPath, width, height) {
  let file = config.inkscapePath;
  let args = [
    '-z',
    '-e', destinationPath,
    '-w', width,
    '-h', height,
    sourcePath
  ];
  let ret = await execFile(file, args);
}

function logFatal(msg) {
  console.error('[E]', msg);
  process.exit(1);
}

let resultFolder = './result';

async function main() {
  // Remove previous result folder
  await fsp.remove(resultFolder).catch((err) => {
    console.log('No previous result folder found');
  });

  let temporaryFolder = '';
  try {
    temporaryFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'pajlada-'));
  } catch (err) {
    logFatal('Unable to create temporary folder: ' + err);
  }

  fs.mkdirSync(resultFolder);

  let files = fs.readdirSync(config.sourceFolder);

  console.info(`Processing ${files.length} files`);;

  var wg = new WaitGroup;

  for (let file of files) {
    var ext = path.extname(file);

    if (ext != '.svg') {
      continue;
    }

    wg.add();

    try {
      processFile(path.join(config.sourceFolder, file), temporaryFolder).then(() => {
        wg.done();
      });
    } catch (err) {
      console.log(err);
    }
  };

  wg.wait(() => {
    fsp.remove(temporaryFolder).catch((err) => {
      logFatal('Error unlinking temporary folder: ' + err);
    });
  });
}

async function processFile(inPath, temporaryFolder) {
  let buf = null;
  try {
    buf = fs.readFileSync(inPath);
  } catch (err) {
    logFatal('Error reading file at ' + inPath + '. ' + err);
  }
  let data = buf.toString('utf8');

  var promises = [];

  for (let targetColor of config.targetColors) {
    promises.push(processFileColor(inPath, temporaryFolder, targetColor, data));
  };

  await Promise.all(promises);
}

async function processFileColor(inPath, temporaryFolder, targetColor, data) {
  // Create new data
  let newData = data;
  for (sourceColor of config.sourceColors) {
    newData = newData.replace(new RegExp(sourceColor, 'g'), targetColor.color);
  }

  // Create new path
  let ext = path.extname(inPath);
  let fileName = path.basename(inPath, ext);
  let newFileName = fileName + '-' + targetColor.name + ext;
  let newPath = path.join(temporaryFolder, newFileName);

  try {
    fs.writeFileSync(newPath, Buffer.from(newData, 'utf8'));
  } catch (err) {
    logFatal('Error writing file to ' + newPath + ': ' + err);
  }
  let destinationPath = resultFolder + '\\' + fileName + '-' + targetColor.name + '.png';
  await inkscapeExport(newPath, destinationPath, 128, 128);
  console.log('Done with ' + targetColor.name + ' for ' + fileName);
}

main();
