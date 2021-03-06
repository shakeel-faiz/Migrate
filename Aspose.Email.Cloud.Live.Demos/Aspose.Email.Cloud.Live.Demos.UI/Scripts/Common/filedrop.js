// File Upload Component
// options:
// - DropFilesPrompt (string)
// - ChooseFilePrompt (string)
// - Accept (string)
// - Multiple (boolean)
// - UseSorting (boolean)
// - MaximumUploadFiles (number)
// - FileWrongTypeMessage (string)
// - FileAmountMessage (string)
// - FileSelectMessage (string)
// - UploadOptions (array of string)
// - UIBasePath (string)
// - Method (callback)
// - UploadAndRedirect (boolean)
// - showAlert (function (string) => void)
// - hideAlert (function () => void)
// - showLoader (function () => void)
// - progress (function () => void)

(function ($) {
    $.fn.filedrop = function (options) {
        var getRandomIntInclusive = function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        var randomId = getRandomIntInclusive(1, Number.MAX_SAFE_INTEGER);
        var acceptExts = options.Accept.split(/\s*,\s*/).map(function (ext) {
            return ext.substring(1).toUpperCase();
        });

        var droppedFiles = [];

        var getFileExtension = function (file) {
            var pos = file.name.lastIndexOf('.');
            return pos !== -1 ? file.name.substring(pos + 1).toUpperCase() : null;
        };

        var nextFileId = function () {
            var id = 1;
            var found;
            do {
                found = false;

                for (let i = 0; i < droppedFiles.length; i++) {
                    if (droppedFiles[i].id === id) {
                        id += 1;
                        found = true;
                        break;
                    }
                }
            } while (found);
            return id;
        };

        var preventFileDrop = function (evt) {
            evt = evt || event;
            evt.preventDefault();
            evt.stopPropagation();
        };

        var removeFileBlock = function (id) {
            var pos;
            for (pos = 0; pos < droppedFiles.length; pos++) {
                if (droppedFiles[pos].id === id) {
                    break;
                }
            }
            if (pos < droppedFiles.length) {
                droppedFiles.splice(pos, 1);
                $('#filedrop-' + randomId).find('#fileupload-' + id).remove();
                if (droppedFiles.length === 0) {
                    $('#filedrop-' + randomId).find('.chooseFilesLabel').removeClass('hidden');
                }
            }
        };

        var moveUpFileBlock = function (id) {
            var pos;
            for (pos = 0; pos < droppedFiles.length; pos++) {
                if (droppedFiles[pos].id === id) {
                    break;
                }
            }
            if (pos < droppedFiles.length && pos !== 0) {
                var prevId = droppedFiles[pos - 1].id;
                var flTemp = droppedFiles[pos - 1];
                droppedFiles[pos - 1] = droppedFiles[pos];
                droppedFiles[pos] = flTemp;

                var block = $('#filedrop-' + randomId + ' > #fileupload-' + id).detach();
                $('#filedrop-' + randomId + ' > #fileupload-' + prevId).before(block);
            }
        };

        var moveDownFileBlock = function (id) {
            var pos;
            for (pos = 0; pos < droppedFiles.length; pos++) {
                if (droppedFiles[pos].id == id) {
                    break;
                }
            }
            if (pos < droppedFiles.length && pos != (droppedFiles.length - 1)) {
                var nextId = droppedFiles[pos + 1].id;
                var flTemp = droppedFiles[pos + 1];
                droppedFiles[pos + 1] = droppedFiles[pos];
                droppedFiles[pos] = flTemp;

                var block = $('#filedrop-' + randomId + ' > #fileupload-' + id).detach();
                $('#filedrop-' + randomId + ' > #fileupload-' + nextId).after(block);
            }
        }

        var appendFileBlock = function (file) {
            var id = nextFileId();
            var name = file.name;
            var fileMoveUpLink = null;
            var fileMoveDownLink = null;
            if (options.UseSorting) {
                fileMoveUpLink = $('\
                    <a class="fileMoveUpLink">\
                        <i class="fa fa-arrow-up"></i>\
                    </a>\
                ');
                fileMoveDownLink = $('\
                    <a class="fileMoveDownLink">\
                        <i class="fa fa-arrow-down></i>"\
                    </a>\
                ');
                fileMoveUpLink.find("i").on('click', function () {
                    moveUpFileBlock(id);
                });
                fileMoveDownLink.find("i").on('click', function () {
                    moveDownFileBlock(id);
                });
            }
            var fileRemoveLink = $('\
                <a class="fileRemoveLink">\
                    <i class="fa fa-times"></i>\
                </a>\
            ');
            fileRemoveLink.find("i").on('click', function () {
                removeFileBlock(id);
            });
            var spanFileName = $('\
                <span class="filename">\
                    <label class="custom-file-upload" style="display:inline">'+ name + '</label>\
                </span>\
            ');
            if (fileMoveUpLink != null && fileMoveDownLink != null) {
                spanFileName.append(fileMoveUpLink);
                spanFileName.append(fileMoveDownLink);
            }
            spanFileName.append(fileRemoveLink);

            var fileBlock = $('<div id="fileupload-' + id + '" class="fileupload"></div>');
            fileBlock.on('dragover', preventFileDrop);
            fileBlock.on('drop', preventFileDrop);
            fileBlock.append(spanFileName);

            $('#filedrop-' + randomId).append(fileBlock);
            droppedFiles.push({
                id,
                file,
                name
            });
        };

        var prepareFormData = function (min = 1, max = undefined) {
            if (max === undefined)
                max = options.MaximumUploadFiles;

            if (droppedFiles.length) {
                if (droppedFiles.length < min || droppedFiles.length > max) {
                    options.showAlert(options.FileAmountMessage);
                    return null;
                }

                var data = new FormData();
                var dotPos, ext;
                var f;
                for (var i = 0; i < droppedFiles.length; i++) {
                    f = droppedFiles[i];
                    dotPos = f.name.lastIndexOf('.');
                    ext = dotPos >= 0 ? f.name.substring(dotPos + 1).toUpperCase() : null;
                    if (ext != null && options.UploadOptions.indexOf(ext) !== -1) {
                        data.append(droppedFiles[i].name, droppedFiles[i].file);
                    } else {
                        options.showAlert(options.FileWrongTypeMessage + ext);
                        return null;
                    }
                }
                return data;
            } else {
                options.showAlert(options.FileSelectMessage);
                return null;
            }
        };

        var uploadFileSelected = function (event) {
            var bError = false;
            if (event.target.files && event.target.files.length) {
                var fileCount = event.target.files.length + droppedFiles.length;
                if (fileCount <= options.MaximumUploadFiles) {
                    var ext;
                    options.hideAlert();
                    for (var i = 0; i < event.target.files.length; i++) {
                        ext = getFileExtension(event.target.files[i]);
                        if (ext !== null && acceptExts.indexOf(ext) !== -1) {
                            appendFileBlock(event.target.files[i])
                        } else {
                            bError = true;
                            if (ext !== null)
                                ext = ext.toUpperCase();
                            options.showAlert(options.FileWrongTypeMessage + ext);
                        }
                    }
                } else {
                    bError = true;
                    options.showAlert(options.FileAmountMessage);
                    window.setTimeout(function () {
                        options.hideAlert();
                    }, 5000);
                }
            }

            // clear the file input field
            $('input#UploadFileInput-' + randomId).val('')
            return bError;
        };

        var fileDropBlockStr = '\
            <div class="filedrop filedrop-mvc fileplacement" id="filedrop-' + randomId + '"' + '>\
                <label for="UploadFileInput-' + randomId + '" style="margin-top: 50px;text-decoration: underline">' + options.DropFilesPrompt + '</label>\
                <input type="file" class="uploadfileinput" id="UploadFileInput-' + randomId + '" name="UploadFileInput-' + randomId + '"\
                    title=""\
                    accept="' + options.Accept + '"' +
            (options.Multiple ? 'multiple="' + options.Multiple + '"' : '') +
            '/>\
            </div>';

        var fileDropBlock = $(fileDropBlockStr);

        //adding file drop block
        this.prepend(fileDropBlock);

        //adding event handlers
        $('input#UploadFileInput-' + randomId).on('change', uploadFileSelected);

        // return object with access fields
        return {
            get droppedFiles() {
                return droppedFiles;
            },
            get prepareFormData() {
                return prepareFormData;
            },
            reset: function reset() {
                droppedFiles = [];
                $('#filedrop-' + randomId).find('div[id^=fileupload-]').remove();
            }
        };
    };


})(jQuery)
