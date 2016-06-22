/**
 * Created by ying on 07/03/16.
 */
var OpenFormatValidate = {
    errorText: "",
    noticeText: "",

    /**
     * Main function to Validate display type configuration.
     *
     * @param {Object} display
     */
    display: function (display) {
        this.errorText  = '';
        this.noticeText = '';
        for (var key in display) {
            if (!(display[key] instanceof Array)) {
                this.__error("Key '", key, "' is not an array.");
            } else {
                if (display[key].length > 1) {
                    this.__error("Key '", key, "' has more than one item.");
                }
            }
        }
        if (this.errorText) {
            throw new Error(this.errorText);
        }
    },

    /**
     * Main function to check field configuration.
     *
     * @param field
     */
    field: function (field) {
        this.errorText  = '';
        this.noticeText = '';
        for (var key in field) {
            switch (key) {
                case 'format':
                    this.__format(field[key]);
                    break;

                case 'content':
                    this.__content(field[key]);
                    break;

                case 'values':
                    this.__values(field);
                    break;

                case "attribute":
                    this.__attribute(field[key]);
                    break;

                case "match":
                    this.__checkString(field[key], key, 'Match');
                    break;

                default:
                    if (key.substr(0, 1) !== '#') {
                        this.__error("Unknown field key '", key, "' is invalid. Only format, content, values, attribute or match can be chosen.");
                    }
                    break;
            }
        }
        if (this.errorText) {
            throw new Error(this.errorText);
        }
    },

    /**
     * Check for format configuration section.
     *
     * @param {Object} format
     * @private
     */
    __format: function (format) {
        for (var key in format) {
            switch (key) {
                case "punctuation":
                case "subkeyPunctuation":
                    var subList = ["#comment", "first", "next", "last"];
                    var count   = 0;
                    for (var subkey in format[key]) {
                        var pos = subList.indexOf(subkey);
                        if (pos === -1) {
                            this.__error("Punctuation '", subkey, "' is invalid. It should be 'first', 'next' or 'last'.");
                        } else {
                            count++;
                            subList.splice(pos, 1);
                        }
                    }
                    if (count < 3) {
                        this.__error("Punctuation is missing following key(s) '", subList.join(), "'.");
                    }
                    break;

                case "result":
                    var subList = ["string", "array"];
                    this.__checkString(format[key], key, "Result");
                    if (subList.indexOf(format[key]) === -1) {
                        this.__error("Result type '", format[key], "' is invalid. Only string and array can be chosen.");
                    }
                    break;

                case "translation":
                    this.__checkString(format[key], key, "Translation");
                    // TODO: Validate that the file exists.
                    break;

                default:
                    if (key == 'element-format') {
                        this.__notice("Format type '", key, "' is deprecated. Use 'subkeyPunctuation' instead.");
                    }
                    else if (key.substr(0, 1) !== '#') {
                        this.__error("Unknown format type '", key, "' is invalid. Only punctuation, subkeyPunctuation and result can be chosen.");
                    }
            }
        }

    },

    /**
     * Check for content configuration section.
     *
     * @param {Object} content
     * @private
     */
    __content: function (content) {
        var foundField = false, foundSubfields = false;
        for (var key in content) {
            if ((typeof content[key] == "string")) {
                if ("#comment" !== key) { // 
                    // TO DO: Use "boolean" key in object
                    this.__checkConfigFileReference(content[key], key, 'Config file reference');
                }
            } else {
                for (var subkey in content[key]) {
                    switch (subkey) {
                        case 'content':
                            foundField     = true;
                            foundSubfields = true;
                            this.__content(content[key][subkey]);
                            break;

                        case 'values':
                            this.__values(content[key]);
                            break;

                        case 'value':
                            foundField     = true;
                            foundSubfields = true;
                            this.__checkString(content[key][subkey], subkey, 'Value');
                            break;

                        case 'attribute':
                            this.__attribute(content[key][subkey]);
                            break;

                        case 'field':
                            foundField = true;
                            this.__checkString(content[key][subkey], subkey, 'Field');
                            break;

                        case 'function':
                            foundField     = true;
                            foundSubfields = true;
                            this.__checkString(content[key][subkey], subkey, 'Function');
                            break;

                        case 'subfields':
                        case 'subfieldsOrder':
                            foundSubfields = true;
                            this.__subfields(content[key][subkey]);
                            break;

                        case 'subfieldsMatch':
                            if (content[key][subkey] instanceof Object) {
                                var localKey = Object.keys(content[key][subkey])[0];
                                this.__checkString(content[key][subkey][localKey], localKey, "Subfields Match");
                                if (Object.keys(content[key][subkey]).length > 1) {
                                    this.__error("At the moment there can only be one subfields match.", ' ', "Please remove so there is only one left");
                                }
                            } else {
                                this.__error("Incorrect type '", content[key][subkey].constructor, "'. Should be an object type.")
                            }
                            break;

                        case 'match':
                            this.__checkString(content[key][subkey], subkey, 'Match');
                            break;

                        case 'format':
                            this.__format(content[key][subkey]);
                            break;

                        case 'boolean':
                            this.__checkConfigFileReference(content[key][subkey], subkey, 'Config file reference');
                            break;

                        case "translation":
                            this.__checkString(content[key][subkey], subkey, 'Translation');
                            // TODO: Validate that the translation file exists.
                            break;

                        default:
                            if (subkey.substr(0, 1) !== '#') {
                                this.__error("Unknown content type '", key + ":" + subkey, "' is invalid. Only field, function, subfields, subfieldsOrder, subfieldsMatch, match, translation and format can be chosen.");
                            }
                            break;
                    }
                }
            }
        }
        if (!foundField || !foundSubfields) {
            if (!foundField) {
                this.__error("Missing field for ", content, ".")
            }
            if (!foundSubfields) {
                this.__error("Missing subfields for ", content, ".")
            }
        }
    },

    /**
     * Check for subfields configuration section.
     *
     * @param {*} subfields
     * @private
     */
    __subfields: function (subfields) {
        if (subfields instanceof Array) {
            for (var subfieldId in subfields) {
                if (subfields[subfieldId] instanceof Object) {
                    if (Object.keys(subfields[subfieldId]).length > 1) {
                        var keyCount = 0;
                        for (var subfieldPunctuationKey in subfields[subfieldId]) {
                            if ('#' !== subfieldPunctuationKey.substring(0, 1)) {
                                keyCount++;
                            }
                        }
                        if (keyCount > 1) {
                            this.__error("There can only be one element in each subfield (except for comments). \nCurrent subfield '", subfields[subfieldId], "'.")
                        }
                        
                    } else {
                        var localKey = Object.keys(subfields[subfieldId])[0];
                        if (subfields[subfieldId][localKey] instanceof Object) {
                            var keyList = ["prefix", "suffix"];
                            for (var subfieldPunctuationKey in subfields[subfieldId][localKey]) {
                                if (keyList.indexOf(subfieldPunctuationKey) > -1) {
                                    this.__notice("This punctuation for subfield ", subfieldPunctuationKey, " is depreciated for subfield " + localKey + ". In the future use first, next and last.");
                                }
                            }
                            keyList.push("#comment", "first", "next", "last");
                            for (var subfieldPunctuationKey in subfields[subfieldId][localKey]) {
                                if (keyList.indexOf(subfieldPunctuationKey) === -1) {
                                    this.__error("This punctuation for subfield ", subfieldPunctuationKey, " is invalid. Use first, next, last or #comment instead.");
                                }
                            }
                            var keyCount = 0;
                            for (var subfieldPunctuationKey in subfields[subfieldId][localKey]) {
                                if ('#' !== subfieldPunctuationKey.substring(0, 1)) {
                                    keyCount++;
                                }
                            }
                            if (keyCount > 3) {
                                this.__error("To many keys for punctuation ", subfields[subfieldId], ". please remove the surplus.");
                            }
                        }
                    }
                } else {
                    this.__error("Wrong type for '", subfieldId, "'. It should be an object.");
                }
            }
        } else {
            this.__error("Wrong type for '", subkey, "'. It should be an array.");
        }
    },

    /**
     * Check for values configuration section.
     *
     * @param field
     * @private
     */
    __values: function (field) {

        switch (typeof field['values']) {
            case 'string':
                this.__valuesParsing(field, field['values']);
                break;

            case 'object':
                if (field['values'] instanceof Array) {
                    for (var key in field['values']) {
                        var checkName = Object.keys(field['values'][key])[0];
                        this.__valuesParsing(field, checkName);
                        var valueName = field['values'][key][checkName];
                        this.__valuesParsing(field, valueName);
                    }
                } else {
                    for (var key in field['values']) {
                        this.__valuesParsing(field, key);
                        this.__valuesParsing(field, field['values'][key]);
                    }
                }
                break;
        }
    },

    __valuesParsing: function (field, string) {
        var type = " ";
        if (string == 'default') {
          return;
        }
        if (string !== undefined) {
            if (string.indexOf('||') > 0) {
                type = '||';
            }
            if (string.indexOf('&&') > 0) {
                type = '&&';
            }
            var values = string.split(type);
            for (var key in values) {
                var fieldName = values[key].trim();
                // check if element(s) in 'value' refer to a valid key in 'content'
                if (field.content[fieldName] == undefined) {
                    this.__error("The values field name '", fieldName, "' doesn't exist in content.");
                }
            }
        }
    },

    /**
     * Check for string type configuration.
     *
     * @param {*} object
     * @param {string} key
     * @param {string} object
     * @private
     */
    __checkString: function (object, key, type) {
        if (typeof object !== "string") {
            this.__error(type + " type '", key, "' is invalid. The type can only be string.");
        }
    },

    /**
     * Check for config reference type configuration.
     *
     * @param {*} string
     * @param {string} key
     * @param {string} type
     * @private
     */
    __checkConfigFileReference: function (string, key, type) {
        var prefix = string.slice(0, 1);
        var suffix = string.slice(-1);
        if (prefix !== "{" || suffix !== "}") {
            this.__error(type + " type '", key, "' is invalid. The format is: {filename}.");
            // TO DO : check if config file exist (and is valid).
        }
    },

    /**
     * Check for attribute configuration section.
     *
     * @param {Object} attribute
     * @private
     */
    __attribute: function (attribute) {
        // Currently we only support attribute:type. This needs to be updated once we will add more attributes.
        if (Object.keys(attribute).length === 0) {
            return;
        }
        /*if (attribute['type'] === undefined) {
            this.__error("Only 'type' is allowed for attribute for now.");
        }*/
        if (Object.keys(attribute).length > 1) {
            this.__error("There is more than one attribute ", attribute, ". Only 'type' is allowed for now.");
        }
    },

    /**
     * Set the error text to be shown.
     *
     * @param {string} startText
     * @param {string|Object} key
     * @param {string} endText
     * @private
     */
    __error: function (startText, key, endText) {
        if (key === undefined) {
            key = '';
        }
        if (endText === undefined) {
            endText = '';
        }
        this.errorText += startText + JSON.stringify(key, null, 2) + endText + "\n";
    },

    /**
     * Set the notice text to be shown.
     *
     * @param {string} startText
     * @param {string|Object} key
     * @param {string} endText
     * @private
     */
    __notice: function (startText, key, endText) {
        if (key === undefined) {
            key = '';
        }
        if (endText === undefined) {
            endText = '';
        }
        this.noticeText += startText + JSON.stringify(key, null, 2) + endText + "\n";
    }
};