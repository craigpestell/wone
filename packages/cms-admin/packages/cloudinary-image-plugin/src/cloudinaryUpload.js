/**
 * Taken, CommonJS-ified, and heavily modified from:
 * https://github.com/flyingsparx/NodeDirectUploader
 */

 const cloudinary = require('cloudinary');

CloudinaryUpload.prototype.server = '';
CloudinaryUpload.prototype.signingUrl = '/sign-s3';
CloudinaryUpload.prototype.signingUrlMethod = 'GET';
CloudinaryUpload.prototype.successResponses = [200, 201];
CloudinaryUpload.prototype.fileElement = null;
CloudinaryUpload.prototype.files = null;

CloudinaryUpload.prototype.onFinishS3Put = function(signResult, file) {
  return console.log('base.onFinishS3Put()', signResult.publicUrl);
};

CloudinaryUpload.prototype.preprocess = function(file, next) {
  console.log('base.preprocess()', file);
  return next(file);
};

CloudinaryUpload.prototype.onProgress = function(percent, status, file) {
  return console.log('base.onProgress()', percent, status);
};

CloudinaryUpload.prototype.onError = function(status, file) {
  return console.log('base.onError()', status);
};

CloudinaryUpload.prototype.onSignedUrl = function(result) {};

CloudinaryUpload.prototype.scrubFilename = function(filename) {
  return filename.replace(/[^\w\d_\-\.]+/gi, '');
};

function CloudinaryUpload(options) {
  if (options == null) {
    options = {};
  }
  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }
  var files = this.fileElement ? this.fileElement.files : this.files || [];
  this.handleFileSelect(files);
}

CloudinaryUpload.prototype.handleFileSelect = function(files) {
  var result = [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    this.preprocess(
      file,
      function(processedFile) {
        this.onProgress(0, 'Waiting', processedFile);
        result.push(this.uploadFile(processedFile));
        return result;
      }.bind(this),
    );
  }
};

CloudinaryUpload.prototype.createCORSRequest = function(method, url, opts) {
  var opts = opts || {};
  var xhr = new XMLHttpRequest();

  if (xhr.withCredentials != null) {
    xhr.open(method, url, true);
    if (opts.withCredentials != null) {
      xhr.withCredentials = opts.withCredentials;
    }
  } else if (typeof XDomainRequest !== 'undefined') {
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
};

CloudinaryUpload.prototype.executeOnSignedUrl = function(file, callback) {
  //API_KEY:API_SECRET@api.cloudinary.com/v1_1/CLOUD_NAME/resources/image
  var fileName = this.scrubFilename(file.name);
  // cloudinary.v2.uploader.upload(file, options, callback);

  var queryString = '?exif=1';
  if (this.s3path) {
    queryString += '&path=' + encodeURIComponent(this.s3path);
  }
  if (this.signingUrlQueryParams) {
    var signingUrlQueryParams =
      typeof this.signingUrlQueryParams === 'function' ? this.signingUrlQueryParams() : this.signingUrlQueryParams;
    Object.keys(signingUrlQueryParams).forEach(function(key) {
      var val = signingUrlQueryParams[key];
      queryString += '&' + key + '=' + val;
    });
  }
  var xhr = this.createCORSRequest(this.signingUrlMethod, this.server + this.signingUrl + queryString, {
    withCredentials: this.signingUrlWithCredentials,
  });
  if (this.signingUrlHeaders) {
    var signingUrlHeaders =
      typeof this.signingUrlHeaders === 'function' ? this.signingUrlHeaders() : this.signingUrlHeaders;
    Object.keys(signingUrlHeaders).forEach(function(key) {
      var val = signingUrlHeaders[key];
      console.log('setRequestHeader: ', key, ' - ', val);
      xhr.setRequestHeader(key, val);
    });
  }
  xhr.overrideMimeType && xhr.overrideMimeType('text/plain; charset=x-user-defined');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && this.successResponses.indexOf(xhr.status) >= 0) {
      var result;
      try {
        result = JSON.parse(xhr.responseText);
        this.onSignedUrl(result);
      } catch (error) {
        this.onError('Invalid response from server', file);
        return false;
      }
      return callback(result);
    } else if (xhr.readyState === 4 && this.successResponses.indexOf(xhr.status) < 0) {
      return this.onError('Could not contact request signing server. Status = ' + xhr.status, file);
    }
  }.bind(this);
  return xhr.send();
};

CloudinaryUpload.prototype.uploadToS3 = function(file, signResult) {
  var xhr = this.createCORSRequest('PUT', signResult.signedUrl);
  if (!xhr) {
    this.onError('CORS not supported', file);
  } else {
    xhr.onload = function() {
      if (this.successResponses.indexOf(xhr.status) >= 0) {
        this.onProgress(100, 'Upload completed', file);
        return this.onFinishS3Put(signResult, file);
      } else {
        return this.onError('Upload error: ' + xhr.status, file);
      }
    }.bind(this);
    xhr.onerror = function() {
      return this.onError('XHR error', file);
    }.bind(this);
    xhr.upload.onprogress = function(e) {
      var percentLoaded;
      if (e.lengthComputable) {
        percentLoaded = Math.round((e.loaded / e.total) * 100);
        return this.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing' : 'Uploading', file);
      }
    }.bind(this);
  }
  xhr.setRequestHeader('Content-Type', file.type);
  if (this.contentDisposition) {
    var disposition = this.contentDisposition;
    if (disposition === 'auto') {
      if (file.type.substr(0, 6) === 'image/') {
        disposition = 'inline';
      } else {
        disposition = 'attachment';
      }
    }

    var fileName = this.scrubFilename(file.name);
    xhr.setRequestHeader('Content-Disposition', disposition + '; filename="' + fileName + '"');
  }
  if (signResult.headers) {
    var signResultHeaders = signResult.headers;
    Object.keys(signResultHeaders).forEach(function(key) {
      var val = signResultHeaders[key];
      xhr.setRequestHeader(key, val);
    });
  }
  if (this.uploadRequestHeaders) {
    var uploadRequestHeaders = this.uploadRequestHeaders;
    Object.keys(uploadRequestHeaders).forEach(function(key) {
      var val = uploadRequestHeaders[key];
      xhr.setRequestHeader(key, val);
    });
  } else {
    xhr.setRequestHeader('x-amz-acl', 'public-read');
  }
  this.httprequest = xhr;
  return xhr.send(file);
};

CloudinaryUpload.prototype.uploadFile = function(file) {
  var uploadToS3Callback = this.uploadToS3.bind(this, file);

  if (this.getSignedUrl) return this.getSignedUrl(file, uploadToS3Callback);
  return this.executeOnSignedUrl(file, uploadToS3Callback);
};

CloudinaryUpload.prototype.abortUpload = function() {
  this.httprequest && this.httprequest.abort();
};

module.exports = CloudinaryUpload;
