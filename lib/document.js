"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jszip = require("jszip");

var _jszip2 = _interopRequireDefault(_jszip);

var _cheerio = require("cheerio");

var _cheerio2 = _interopRequireDefault(_cheerio);

require("./cheerio-fn");

var _htmlparser = require("htmlparser2");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var normalize = function normalize(path) {
	return path.split("/").filter(function (a) {
		return a != ".";
	}).reduceRight(function (n, a) {
		if (a == "..") {
			n.r++;
		} else if (n.r) {
			n.r--;
		} else {
			n.trimed.unshift(a);
		}
		return n;
	}, { trimed: [], r: 0 }).trimed.join("/");
};
/**
 *  document parser
 *
 *  @example
 *  Document.load(file)
 *  	.then(doc=>doc.parse())
 */

var ZipDocument = function () {
	function ZipDocument(parts, raw, props) {
		_classCallCheck(this, ZipDocument);

		this.parts = parts;
		this.raw = raw;
		this.props = props;
		this._shouldReleased = new Map();
	}

	_createClass(ZipDocument, [{
		key: "normalizePath",
		value: function normalizePath() {
			return normalize.apply(undefined, arguments);
		}
	}, {
		key: "getPart",
		value: function getPart(name) {
			name = normalize(name);
			return this.parts[name];
		}
	}, {
		key: "getDataPart",
		value: function getDataPart(name) {
			name = normalize(name);
			var part = this.parts[name];
			var crc32 = part._data.crc32;
			var data = part.asUint8Array(); //unsafe call, part._data is changed
			data.crc32 = part._data.crc32 = crc32; //so keep crc32 on part._data for future
			return data;
		}
	}, {
		key: "getDataPartAsUrl",
		value: function getDataPartAsUrl(name) {
			var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "*/*";

			name = normalize(name);
			var part = this.parts[name];
			var crc32 = part._data.crc32;
			if (!this._shouldReleased.has(crc32)) {
				this._shouldReleased.set(crc32, URL.createObjectURL(new Blob([this.getDataPart(name)], { type: type })));
			}
			return this._shouldReleased.get(crc32);
		}
	}, {
		key: "getPartCrc32",
		value: function getPartCrc32(name) {
			name = normalize(name);
			var part = this.parts[name];
			var crc32 = part._data.crc32;
			return crc32;
		}
	}, {
		key: "release",
		value: function release() {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this._shouldReleased[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _step$value = _slicedToArray(_step.value, 2),
					    url = _step$value[1];

					URL.revokeObjectURL(url);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		}
	}, {
		key: "getObjectPart",
		value: function getObjectPart(name) {
			name = normalize(name);
			var part = this.parts[name];
			if (!part) return null;else if (part.cheerio) return part;else {
				var $ = Object.assign(this.parts[name] = this.constructor.parseXml(part.asText()), { part: name });
				Object.assign($.root()[0].attribs, { part: name });
				$.prototype.part = function () {
					return name;
				};
				return $;
			}
		}
	}, {
		key: "$",
		value: function $(node) {
			var root = function root(a) {
				return a.root || a.parent && root(a.parent);
			};
			return this.getObjectPart(root(node).attribs.part)(node);
		}
	}, {
		key: "parse",
		value: function parse(domHandler) {}
	}, {
		key: "render",
		value: function render() {}
	}, {
		key: "serialize",
		value: function serialize() {
			var _this = this;

			var newDoc = new _jszip2.default();
			Object.keys(this.parts).forEach(function (path) {
				var part = _this.parts[path];
				if (part.cheerio) {
					newDoc.file(path, part.xml());
				} else {
					newDoc.file(path, part._data, part.options);
				}
			});
			return newDoc;
		}
	}, {
		key: "save",
		value: function save(file, options) {
			file = file || this.props.name || Date.now() + ".docx";

			var newDoc = this.serialize();

			if (typeof document != "undefined" && window.URL && window.URL.createObjectURL) {
				var data = newDoc.generate(_extends({}, options, { type: "blob", mimeType: this.constructor.mime }));
				var url = window.URL.createObjectURL(data);
				var link = document.createElement("a");
				document.body.appendChild(link);
				link.download = file;
				link.href = url;
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
			} else {
				var _data = newDoc.generate(_extends({}, options, { type: "nodebuffer" }));
				return new Promise(function (resolve, reject) {
					return require("f" + "s").writeFile(file, _data, function (error) {
						error ? reject(error) : resolve(_data);
					});
				});
			}
		}
	}, {
		key: "clone",
		value: function clone() {
			var _this2 = this;

			var zip = new _jszip2.default();
			var props = props ? JSON.parse(JSON.stringify(this.props)) : props;
			var parts = Object.keys(this.parts).reduce(function (state, k) {
				var v = _this2.parts[k];
				if (v.cheerio) {
					zip.file(v.name, v.xml(), v.options);
					state[k] = zip.file(v.name);
				} else {
					zip.file(v.name, v._data, v.options);
					state[k] = zip.file(v.name);
				}
				return state;
			}, {});
			return new this.constructor(parts, zip, props);
		}

		/**
   *  a helper to load document file
  	 *  @param inputFile {File} - a html input file, or nodejs file
   *  @return {Promise}
   */

	}], [{
		key: "load",
		value: function load(inputFile) {
			var DocumentSelf = this;

			if (inputFile instanceof ZipDocument) return Promise.resolve(inputFile);

			return new Promise(function (resolve, reject) {
				function parse(data) {
					var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

					try {
						var raw = new _jszip2.default(data),
						    parts = {};
						raw.filter(function (path, file) {
							return parts[path] = file;
						});
						resolve(new DocumentSelf(parts, raw, props));
					} catch (error) {
						reject(error);
					}
				}

				if (typeof inputFile == 'string') {//file name
					// require('fs').readFile(inputFile,function(error, data){
					// 	if(error)
					// 		reject(error);
					// 	else if(data){
					// 		parse(data, {name:inputFile.split(/[\/\\]/).pop().replace(/\.docx$/i,'')})
					// 	}
					// })
				} else if (inputFile instanceof Blob) {
					var reader = new FileReader();
					reader.onload = function (e) {
						parse(e.target.result, inputFile.name ? {
							name: inputFile.name.replace(/\.docx$/i, ''),
							lastModified: inputFile.lastModified,
							size: inputFile.size
						} : { size: inputFile.size });
					};
					reader.readAsArrayBuffer(inputFile);
				} else {
					parse(inputFile);
				}
			});
		}
	}, {
		key: "create",
		value: function create() {
			return this.load(__dirname + "/../templates/blank." + this.ext);
		}
	}, {
		key: "parseXml",
		value: function parseXml(data) {
			try {
				var opt = { xmlMode: true, decodeEntities: false };
				var handler = new ContentDomHandler(opt);
				new _htmlparser.Parser(handler, opt).end(data);
				var parsed = _cheerio2.default.load(handler.dom, opt);
				if (typeof parsed.cheerio == "undefined") parsed.cheerio = "customized";
				return parsed;
			} catch (error) {
				console.error(error);
				return null;
			}
		}
	}]);

	return ZipDocument;
}();

ZipDocument.ext = "unknown";
ZipDocument.mime = "application/zip";
exports.default = ZipDocument;

var ContentDomHandler = function (_DomHandler) {
	_inherits(ContentDomHandler, _DomHandler);

	function ContentDomHandler() {
		_classCallCheck(this, ContentDomHandler);

		return _possibleConstructorReturn(this, (ContentDomHandler.__proto__ || Object.getPrototypeOf(ContentDomHandler)).apply(this, arguments));
	}

	_createClass(ContentDomHandler, [{
		key: "_addDomElement",
		value: function _addDomElement(el) {
			if (el.type == "text" && (el.data[0] == '\r' || el.data[0] == '\n')) ; //remove format whitespaces
			else return _get(ContentDomHandler.prototype.__proto__ || Object.getPrototypeOf(ContentDomHandler.prototype), "_addDomElement", this).call(this, el);
		}
	}]);

	return ContentDomHandler;
}(_htmlparser.DomHandler);

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9kb2N1bWVudC5qcyJdLCJuYW1lcyI6WyJub3JtYWxpemUiLCJwYXRoIiwic3BsaXQiLCJmaWx0ZXIiLCJhIiwicmVkdWNlUmlnaHQiLCJuIiwiciIsInRyaW1lZCIsInVuc2hpZnQiLCJqb2luIiwiWmlwRG9jdW1lbnQiLCJwYXJ0cyIsInJhdyIsInByb3BzIiwiX3Nob3VsZFJlbGVhc2VkIiwiTWFwIiwiYXJndW1lbnRzIiwibmFtZSIsInBhcnQiLCJjcmMzMiIsIl9kYXRhIiwiZGF0YSIsImFzVWludDhBcnJheSIsInR5cGUiLCJoYXMiLCJzZXQiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwiZ2V0RGF0YVBhcnQiLCJnZXQiLCJ1cmwiLCJyZXZva2VPYmplY3RVUkwiLCJjaGVlcmlvIiwiJCIsIk9iamVjdCIsImFzc2lnbiIsImNvbnN0cnVjdG9yIiwicGFyc2VYbWwiLCJhc1RleHQiLCJyb290IiwiYXR0cmlicyIsInByb3RvdHlwZSIsIm5vZGUiLCJwYXJlbnQiLCJnZXRPYmplY3RQYXJ0IiwiZG9tSGFuZGxlciIsIm5ld0RvYyIsIkpTWmlwIiwia2V5cyIsImZvckVhY2giLCJmaWxlIiwieG1sIiwib3B0aW9ucyIsIkRhdGUiLCJub3ciLCJzZXJpYWxpemUiLCJkb2N1bWVudCIsIndpbmRvdyIsImdlbmVyYXRlIiwibWltZVR5cGUiLCJtaW1lIiwibGluayIsImNyZWF0ZUVsZW1lbnQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJkb3dubG9hZCIsImhyZWYiLCJjbGljayIsInJlbW92ZUNoaWxkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJyZXF1aXJlIiwid3JpdGVGaWxlIiwiZXJyb3IiLCJ6aXAiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJyZWR1Y2UiLCJzdGF0ZSIsImsiLCJ2IiwiaW5wdXRGaWxlIiwiRG9jdW1lbnRTZWxmIiwicmVhZGVyIiwiRmlsZVJlYWRlciIsIm9ubG9hZCIsImUiLCJ0YXJnZXQiLCJyZXN1bHQiLCJyZXBsYWNlIiwibGFzdE1vZGlmaWVkIiwic2l6ZSIsInJlYWRBc0FycmF5QnVmZmVyIiwibG9hZCIsIl9fZGlybmFtZSIsImV4dCIsIm9wdCIsInhtbE1vZGUiLCJkZWNvZGVFbnRpdGllcyIsImhhbmRsZXIiLCJDb250ZW50RG9tSGFuZGxlciIsIlBhcnNlciIsImVuZCIsInBhcnNlZCIsImNoZWVyIiwiZG9tIiwiY29uc29sZSIsImVsIiwiRG9tSGFuZGxlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxZQUFVLFNBQVZBLFNBQVU7QUFBQSxRQUFNQyxLQUFLQyxLQUFMLENBQVcsR0FBWCxFQUFnQkMsTUFBaEIsQ0FBdUI7QUFBQSxTQUFHQyxLQUFHLEdBQU47QUFBQSxFQUF2QixFQUNwQkMsV0FEb0IsQ0FDUixVQUFDQyxDQUFELEVBQUdGLENBQUgsRUFBTztBQUNuQixNQUFHQSxLQUFHLElBQU4sRUFBVztBQUNWRSxLQUFFQyxDQUFGO0FBQ0EsR0FGRCxNQUVNLElBQUdELEVBQUVDLENBQUwsRUFBTztBQUNaRCxLQUFFQyxDQUFGO0FBQ0EsR0FGSyxNQUVEO0FBQ0pELEtBQUVFLE1BQUYsQ0FBU0MsT0FBVCxDQUFpQkwsQ0FBakI7QUFDQTtBQUNELFNBQU9FLENBQVA7QUFDQSxFQVZvQixFQVVuQixFQUFDRSxRQUFPLEVBQVIsRUFBV0QsR0FBRSxDQUFiLEVBVm1CLEVBVUZDLE1BVkUsQ0FVS0UsSUFWTCxDQVVVLEdBVlYsQ0FBTjtBQUFBLENBQWhCO0FBV0E7Ozs7Ozs7O0lBT3FCQyxXO0FBSXBCLHNCQUFZQyxLQUFaLEVBQWtCQyxHQUFsQixFQUFzQkMsS0FBdEIsRUFBNEI7QUFBQTs7QUFDM0IsT0FBS0YsS0FBTCxHQUFXQSxLQUFYO0FBQ0EsT0FBS0MsR0FBTCxHQUFTQSxHQUFUO0FBQ0EsT0FBS0MsS0FBTCxHQUFXQSxLQUFYO0FBQ0EsT0FBS0MsZUFBTCxHQUFxQixJQUFJ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QUFPekUsT0FBZCxJQUF3QixXQUEzQixFQUNDeUUsT0FBT3pFLE9BQVAsR0FBZSxZQUFmO0FBQ0QsV0FBT3lFLE1BQVA7QUFDQSxJQVJELENBUUMsT0FBTS9CLEtBQU4sRUFBWTtBQUNaa0MsWUFBUWxDLEtBQVIsQ0FBY0EsS0FBZDtBQUNBLFdBQU8sSUFBUDtBQUNBO0FBQ0Q7Ozs7OztBQXhNbUJqRSxXLENBQ2J3RixHLEdBQUksUztBQURTeEYsVyxDQUVibUQsSSxHQUFLLGlCO2tCQUZRbkQsVzs7SUEyTWY2RixpQjs7Ozs7Ozs7Ozs7aUNBQ1VPLEUsRUFBRztBQUNqQixPQUFHQSxHQUFHdkYsSUFBSCxJQUFTLE1BQVQsS0FBb0J1RixHQUFHekYsSUFBSCxDQUFRLENBQVIsS0FBWSxJQUFaLElBQW9CeUYsR0FBR3pGLElBQUgsQ0FBUSxDQUFSLEtBQVksSUFBcEQsQ0FBSCxFQUNDLENBREQsQ0FDRTtBQURGLFFBR0MsNElBQTRCeUYsRUFBNUI7QUFDRDs7OztFQU44QkMsc0IiLCJmaWxlIjoiZG9jdW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSlNaaXAgZnJvbSAnanN6aXAnXG5pbXBvcnQgY2hlZXIgZnJvbSBcImNoZWVyaW9cIlxuaW1wb3J0IFwiLi9jaGVlcmlvLWZuXCJcbmltcG9ydCB7UGFyc2VyLCBEb21IYW5kbGVyfSBmcm9tIFwiaHRtbHBhcnNlcjJcIlxuXG5jb25zdCBub3JtYWxpemU9cGF0aD0+cGF0aC5zcGxpdChcIi9cIikuZmlsdGVyKGE9PmEhPVwiLlwiKVxuXHQucmVkdWNlUmlnaHQoKG4sYSk9Pntcblx0XHRpZihhPT1cIi4uXCIpe1xuXHRcdFx0bi5yKytcblx0XHR9ZWxzZSBpZihuLnIpe1xuXHRcdFx0bi5yLS1cblx0XHR9ZWxzZXtcblx0XHRcdG4udHJpbWVkLnVuc2hpZnQoYSlcblx0XHR9XG5cdFx0cmV0dXJuIG5cblx0fSx7dHJpbWVkOltdLHI6MH0pLnRyaW1lZC5qb2luKFwiL1wiKVxuLyoqXG4gKiAgZG9jdW1lbnQgcGFyc2VyXG4gKlxuICogIEBleGFtcGxlXG4gKiAgRG9jdW1lbnQubG9hZChmaWxlKVxuICogIFx0LnRoZW4oZG9jPT5kb2MucGFyc2UoKSlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgWmlwRG9jdW1lbnR7XG5cdHN0YXRpYyBleHQ9XCJ1bmtub3duXCJcblx0c3RhdGljIG1pbWU9XCJhcHBsaWNhdGlvbi96aXBcIlxuXG5cdGNvbnN0cnVjdG9yKHBhcnRzLHJhdyxwcm9wcyl7XG5cdFx0dGhpcy5wYXJ0cz1wYXJ0c1xuXHRcdHRoaXMucmF3PXJhd1xuXHRcdHRoaXMucHJvcHM9cHJvcHNcblx0XHR0aGlzLl9zaG91bGRSZWxlYXNlZD1uZXcgTWFwKClcblx0fVxuXG5cdG5vcm1hbGl6ZVBhdGgoKXtcblx0XHRyZXR1cm4gbm9ybWFsaXplKC4uLmFyZ3VtZW50cylcblx0fVxuXG5cdGdldFBhcnQobmFtZSl7XG5cdFx0bmFtZT1ub3JtYWxpemUobmFtZSlcblx0XHRyZXR1cm4gdGhpcy5wYXJ0c1tuYW1lXVxuXHR9XG5cblx0Z2V0RGF0YVBhcnQobmFtZSl7XG5cdFx0bmFtZT1ub3JtYWxpemUobmFtZSlcblx0XHRsZXQgcGFydD10aGlzLnBhcnRzW25hbWVdXG5cdFx0bGV0IGNyYzMyPXBhcnQuX2RhdGEuY3JjMzJcblx0XHRsZXQgZGF0YT1wYXJ0LmFzVWludDhBcnJheSgpLy91bnNhZmUgY2FsbCwgcGFydC5fZGF0YSBpcyBjaGFuZ2VkXG5cdFx0ZGF0YS5jcmMzMj1wYXJ0Ll9kYXRhLmNyYzMyPWNyYzMyLy9zbyBrZWVwIGNyYzMyIG9uIHBhcnQuX2RhdGEgZm9yIGZ1dHVyZVxuXHRcdHJldHVybiBkYXRhXG5cdH1cblxuXHRnZXREYXRhUGFydEFzVXJsKG5hbWUsdHlwZT1cIiovKlwiKXtcblx0XHRuYW1lPW5vcm1hbGl6ZShuYW1lKVxuXHRcdGxldCBwYXJ0PXRoaXMucGFydHNbbmFtZV1cblx0XHRsZXQgY3JjMzI9cGFydC5fZGF0YS5jcmMzMlxuXHRcdGlmKCF0aGlzLl9zaG91bGRSZWxlYXNlZC5oYXMoY3JjMzIpKXtcblx0XHRcdHRoaXMuX3Nob3VsZFJlbGVhc2VkLnNldChjcmMzMixVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFt0aGlzLmdldERhdGFQYXJ0KG5hbWUpXSx7dHlwZX0pKSlcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuX3Nob3VsZFJlbGVhc2VkLmdldChjcmMzMilcblx0fVxuXG5cdGdldFBhcnRDcmMzMihuYW1lKXtcblx0XHRuYW1lPW5vcm1hbGl6ZShuYW1lKVxuXHRcdGxldCBwYXJ0PXRoaXMucGFydHNbbmFtZV1cblx0XHRsZXQgY3JjMzI9cGFydC5fZGF0YS5jcmMzMlxuXHRcdHJldHVybiBjcmMzMlxuXHR9XG5cblx0cmVsZWFzZSgpe1xuXHRcdGZvcihsZXQgWywgdXJsXSBvZiB0aGlzLl9zaG91bGRSZWxlYXNlZCl7XG5cdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKHVybClcblx0XHR9XG5cdH1cblxuXHRnZXRPYmplY3RQYXJ0KG5hbWUpe1xuXHRcdG5hbWU9bm9ybWFsaXplKG5hbWUpXG5cdFx0Y29uc3QgcGFydD10aGlzLnBhcnRzW25hbWVdXG5cdFx0aWYoIXBhcnQpXG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdGVsc2UgaWYocGFydC5jaGVlcmlvKVxuXHRcdFx0cmV0dXJuIHBhcnRcblx0XHRlbHNle1xuXHRcdFx0Y29uc3QgJD1PYmplY3QuYXNzaWduKHRoaXMucGFydHNbbmFtZV09dGhpcy5jb25zdHJ1Y3Rvci5wYXJzZVhtbChwYXJ0LmFzVGV4dCgpKSx7cGFydDpuYW1lfSlcblx0XHRcdE9iamVjdC5hc3NpZ24oJC5yb290KClbMF0uYXR0cmlicyx7cGFydDpuYW1lfSlcblx0XHRcdCQucHJvdG90eXBlLnBhcnQ9KCk9Pm5hbWVcblx0XHRcdHJldHVybiAkXG5cdFx0fVxuXHR9XG5cblx0JChub2RlKXtcbiAgICAgICAgY29uc3Qgcm9vdD1hPT5hLnJvb3QgfHwgKGEucGFyZW50ICYmIHJvb3QoYS5wYXJlbnQpKVxuXHRcdHJldHVybiB0aGlzLmdldE9iamVjdFBhcnQocm9vdChub2RlKS5hdHRyaWJzLnBhcnQpKG5vZGUpXG4gICAgfVxuXG5cdHBhcnNlKGRvbUhhbmRsZXIpe1xuXG5cdH1cblxuXHRyZW5kZXIoKXtcblxuXHR9XG5cblx0c2VyaWFsaXplKCl7XG5cdFx0bGV0IG5ld0RvYz1uZXcgSlNaaXAoKVxuXHRcdE9iamVjdC5rZXlzKHRoaXMucGFydHMpLmZvckVhY2gocGF0aD0+e1xuXHRcdFx0bGV0IHBhcnQ9dGhpcy5wYXJ0c1twYXRoXVxuXHRcdFx0aWYocGFydC5jaGVlcmlvKXtcblx0XHRcdFx0bmV3RG9jLmZpbGUocGF0aCxwYXJ0LnhtbCgpKVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdG5ld0RvYy5maWxlKHBhdGgscGFydC5fZGF0YSwgcGFydC5vcHRpb25zKVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0cmV0dXJuIG5ld0RvY1xuXHR9XG5cblx0c2F2ZShmaWxlLG9wdGlvbnMpe1xuXHRcdGZpbGU9ZmlsZXx8dGhpcy5wcm9wcy5uYW1lfHxgJHtEYXRlLm5vdygpfS5kb2N4YFxuXG5cdFx0bGV0IG5ld0RvYz10aGlzLnNlcmlhbGl6ZSgpXG5cblx0XHRpZih0eXBlb2YoZG9jdW1lbnQpIT1cInVuZGVmaW5lZFwiICYmIHdpbmRvdy5VUkwgJiYgd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwpe1xuXHRcdFx0bGV0IGRhdGE9bmV3RG9jLmdlbmVyYXRlKHsuLi5vcHRpb25zLHR5cGU6XCJibG9iXCIsbWltZVR5cGU6dGhpcy5jb25zdHJ1Y3Rvci5taW1lfSlcblx0XHRcdGxldCB1cmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChkYXRhKVxuXHRcdFx0bGV0IGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobGluaylcblx0XHRcdGxpbmsuZG93bmxvYWQgPSBmaWxlXG5cdFx0XHRsaW5rLmhyZWYgPSB1cmw7XG5cdFx0XHRsaW5rLmNsaWNrKClcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQobGluaylcblx0XHRcdHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybClcblx0XHR9ZWxzZXtcblx0XHRcdGxldCBkYXRhPW5ld0RvYy5nZW5lcmF0ZSh7Li4ub3B0aW9ucyx0eXBlOlwibm9kZWJ1ZmZlclwifSlcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpPT5cblx0XHRcdFx0cmVxdWlyZShcImZcIitcInNcIikud3JpdGVGaWxlKGZpbGUsZGF0YSxlcnJvcj0+e1xuXHRcdFx0XHRcdGVycm9yID8gcmVqZWN0KGVycm9yKSA6IHJlc29sdmUoZGF0YSlcblx0XHRcdFx0fSlcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRjbG9uZSgpe1xuXHRcdGxldCB6aXA9bmV3IEpTWmlwKClcblx0XHRsZXQgcHJvcHM9IHByb3BzID8gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLnByb3BzKSkgOiBwcm9wc1xuXHRcdGxldCBwYXJ0cz1PYmplY3Qua2V5cyh0aGlzLnBhcnRzKS5yZWR1Y2UoKHN0YXRlLCBrKT0+e1xuXHRcdFx0bGV0IHY9dGhpcy5wYXJ0c1trXVxuXHRcdFx0aWYodi5jaGVlcmlvKXtcblx0XHRcdFx0emlwLmZpbGUodi5uYW1lLHYueG1sKCksdi5vcHRpb25zKVxuXHRcdFx0XHRzdGF0ZVtrXT16aXAuZmlsZSh2Lm5hbWUpXG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0emlwLmZpbGUodi5uYW1lLHYuX2RhdGEsdi5vcHRpb25zKVxuXHRcdFx0XHRzdGF0ZVtrXT16aXAuZmlsZSh2Lm5hbWUpXG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc3RhdGVcblx0XHR9LHt9KVxuXHRcdHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3RvcihwYXJ0cyx6aXAsIHByb3BzKVxuXHR9XG5cblx0LyoqXG5cdCAqICBhIGhlbHBlciB0byBsb2FkIGRvY3VtZW50IGZpbGVcblxuXHQgKiAgQHBhcmFtIGlucHV0RmlsZSB7RmlsZX0gLSBhIGh0bWwgaW5wdXQgZmlsZSwgb3Igbm9kZWpzIGZpbGVcblx0ICogIEByZXR1cm4ge1Byb21pc2V9XG5cdCAqL1xuXG5cdHN0YXRpYyBsb2FkKGlucHV0RmlsZSl7XG5cdFx0Y29uc3QgRG9jdW1lbnRTZWxmPXRoaXNcblxuXHRcdGlmKGlucHV0RmlsZSBpbnN0YW5jZW9mIFppcERvY3VtZW50KVxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnB1dEZpbGUpXG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCk9Pntcblx0XHRcdGZ1bmN0aW9uIHBhcnNlKGRhdGEsIHByb3BzPXt9KXtcblx0XHRcdFx0dHJ5e1xuXHRcdFx0XHRcdGxldCByYXc9bmV3IEpTWmlwKGRhdGEpLHBhcnRzPXt9XG5cdFx0XHRcdFx0cmF3LmZpbHRlcigocGF0aCxmaWxlKT0+cGFydHNbcGF0aF09ZmlsZSlcblx0XHRcdFx0XHRyZXNvbHZlKG5ldyBEb2N1bWVudFNlbGYocGFydHMscmF3LHByb3BzKSlcblx0XHRcdFx0fWNhdGNoKGVycm9yKXtcblx0XHRcdFx0XHRyZWplY3QoZXJyb3IpXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYodHlwZW9mIGlucHV0RmlsZT09J3N0cmluZycpey8vZmlsZSBuYW1lXG5cdFx0XHRcdC8vIHJlcXVpcmUoJ2ZzJykucmVhZEZpbGUoaW5wdXRGaWxlLGZ1bmN0aW9uKGVycm9yLCBkYXRhKXtcblx0XHRcdFx0Ly8gXHRpZihlcnJvcilcblx0XHRcdFx0Ly8gXHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHRcdC8vIFx0ZWxzZSBpZihkYXRhKXtcblx0XHRcdFx0Ly8gXHRcdHBhcnNlKGRhdGEsIHtuYW1lOmlucHV0RmlsZS5zcGxpdCgvW1xcL1xcXFxdLykucG9wKCkucmVwbGFjZSgvXFwuZG9jeCQvaSwnJyl9KVxuXHRcdFx0XHQvLyBcdH1cblx0XHRcdFx0Ly8gfSlcblx0XHRcdH1lbHNlIGlmKGlucHV0RmlsZSBpbnN0YW5jZW9mIEJsb2Ipe1xuXHRcdFx0XHR2YXIgcmVhZGVyPW5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0XHRcdHJlYWRlci5vbmxvYWQ9ZnVuY3Rpb24oZSl7XG5cdFx0XHRcdFx0cGFyc2UoZS50YXJnZXQucmVzdWx0LCAoaW5wdXRGaWxlLm5hbWUgPyB7XG5cdFx0XHRcdFx0XHRcdG5hbWU6aW5wdXRGaWxlLm5hbWUucmVwbGFjZSgvXFwuZG9jeCQvaSwnJyksXG5cdFx0XHRcdFx0XHRcdGxhc3RNb2RpZmllZDppbnB1dEZpbGUubGFzdE1vZGlmaWVkLFxuXHRcdFx0XHRcdFx0XHRzaXplOmlucHV0RmlsZS5zaXplXG5cdFx0XHRcdFx0XHR9IDoge3NpemU6aW5wdXRGaWxlLnNpemV9KSlcblx0XHRcdFx0fVxuXHRcdFx0XHRyZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoaW5wdXRGaWxlKTtcblx0XHRcdH1lbHNlIHtcblx0XHRcdFx0cGFyc2UoaW5wdXRGaWxlKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlKCl7XG5cdFx0cmV0dXJuIHRoaXMubG9hZChgJHtfX2Rpcm5hbWV9Ly4uL3RlbXBsYXRlcy9ibGFuay4ke3RoaXMuZXh0fWApXG5cdH1cblxuXHRzdGF0aWMgcGFyc2VYbWwoZGF0YSl7XG5cdFx0dHJ5e1xuXHRcdFx0bGV0IG9wdD17eG1sTW9kZTp0cnVlLGRlY29kZUVudGl0aWVzOiBmYWxzZX1cblx0XHRcdGxldCBoYW5kbGVyPW5ldyBDb250ZW50RG9tSGFuZGxlcihvcHQpXG5cdFx0XHRuZXcgUGFyc2VyKGhhbmRsZXIsb3B0KS5lbmQoZGF0YSlcblx0XHRcdGxldCBwYXJzZWQ9Y2hlZXIubG9hZChoYW5kbGVyLmRvbSxvcHQpXG5cdFx0XHRpZih0eXBlb2YocGFyc2VkLmNoZWVyaW8pPT1cInVuZGVmaW5lZFwiKVxuXHRcdFx0XHRwYXJzZWQuY2hlZXJpbz1cImN1c3RvbWl6ZWRcIlxuXHRcdFx0cmV0dXJuIHBhcnNlZFxuXHRcdH1jYXRjaChlcnJvcil7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKVxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cdH1cbn1cblxuY2xhc3MgQ29udGVudERvbUhhbmRsZXIgZXh0ZW5kcyBEb21IYW5kbGVye1xuXHRfYWRkRG9tRWxlbWVudChlbCl7XG5cdFx0aWYoZWwudHlwZT09XCJ0ZXh0XCIgJiYgKGVsLmRhdGFbMF09PSdcXHInIHx8IGVsLmRhdGFbMF09PSdcXG4nKSlcblx0XHRcdDsvL3JlbW92ZSBmb3JtYXQgd2hpdGVzcGFjZXNcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gc3VwZXIuX2FkZERvbUVsZW1lbnQoZWwpXG5cdH1cbn1cbiJdfQ==