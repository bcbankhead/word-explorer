module.exports = {

  updateData: function(currentUser, theWord, callback){
    var db = require('monk')(process.env.MONGOLAB_URI);
    var userCollection = db.get('words_users');

    userCollection.update(
    { username: currentUser },
    { $pull: { words: theWord } },
    { upsert: true });

    userCollection.update(
    { username: currentUser },
    { $pull: { words: '' } },
    { upsert: true });

    userCollection.update(
    { username: currentUser },
    { $push: { words: theWord } },
    { upsert: true });

    userCollection.update(
    { username: currentUser },
    { $push: { words: { $each: [ ], $sort: 1 } } },
    { upsert: true })

    callback('done')
  },

  defCollect: function(def1,def2){

    var definitions = {};

    if (def1 || def2){
      if (def1 && def2){
        definitions.def1 = def1;
        definitions.def2 = def2;
      } else if (def1 && !def2){
        definitions.def1 = def1;
        definitions.def2 = null;
      } else if (!def1 && def2){
        definitions.def1 = null;
        definitions.def2 = def2;
      }
    } else {
        definitions.def1 = "No definitions available...";
        definitions.def2 = null;
    }
    return definitions;
  },

  pearsonData: function(data){
    var result = {};
    // console.log("pD",data);
    if(data){
      if(data.results){
        if(data.results.length > 0){
          if(data.results[0].headword){
            result.headword = data.results[0].headword
          }
          if(data.results[0].pronunciations){
            if(data.results[0].pronunciations.length > 0){
              if(data.results[0].pronunciations[0].ipa){
                result.ipa = data.results[0].pronunciations[0].ipa;
                // console.log("IPAIPAIPA***********",result.ipa);
              }
            }
          }
          if(data.results[0].senses != null){
            if(data.results[0].senses.length > 0){
              if(data.results[0].senses[0].definition){
                var pearsonDef = data.results[0].senses[0].definition[0];
                result.definition = data.results[0].senses[0].definition[0];
                // console.log("DEFDEFDEF***********",result.definition);
              }
            }
          }
        }
      }
      return result;
    } else {
      return undefined;
    }
  },

  pearsonParts: function(data){
    var defAvail = 0;
    if(data){
      if(data.headword){
        var pearsonHW = data.headword;
        if(pearsonHW.indexOf("-") > 0){
          pearsonHW = "n/a";
        }
      } else {
        var pearsonHW = "n/a"
        defAvail += 1;
      }
      if(data.ipa){
        var pearsonIPA = data.ipa;
      } else {
        var pearsonIPA = "n/a"
      }
      if(data.definition){
        var pearsonDef = data.definition;
      }
    }
    return { HW: pearsonHW, IPA: pearsonIPA, DEF: pearsonDef, DEFAvail: defAvail}
  },

  getData: function(url,callback){
    var unirest = require('unirest');
    unirest.get(url).end(function (response) {
        callback(response.body);
    })
  },

  parseWordNik: function(definition){
    // console.log("wN",definition);
    if (definition.length > 0 || definition[0] != null || definition[0] != ''){
      var definition = definition[0].text;
    } else {
      var definition = 0;
    }
    return definition
  },

  trParse: function(base,input,synonyms1){
    if(input === ""){
      return "error";
    }

    var writeEntry = function(base,type,typeArray){
      var obj = {}
      obj.name = "words." + base + "." + type
      obj.size = 1;
      obj.imports = [];
      for (var i =0; i < typeArray.length;i++){
        if(typeArray[i].indexOf(" ") <= 0 && typeArray[i].indexOf("-") <= 0){
          obj.imports.push("words." + base + "." + typeArray[i])
        } else {
          continue;
        }
      }
      words.push(obj);

      for (var i =0; i < typeArray.length;i++){
        if(typeArray[i].indexOf(" ") <= 0 && typeArray[i].indexOf("-") <= 0){
          var obj = {}
          typeArray[i] = typeArray[i].replace(/\s/g,"-");
          obj.name = "words." + base + "." + typeArray[i];
          obj.size = 1;
          obj.imports = []
          words.push(obj);
        } else {
          continue;
        }
      }
    };

      var adjectives = [];
      var nouns = [];
      var verbs = [];
      var ants = [];
      var words = [];
      var compared = [];

    if(input){
      if (input.adjective){
        if (input.adjective.syn){
          type = "adjective.1adjective";
          writeEntry(base,type,input.adjective.syn);
        }

        if (input.adjective.sim){
          type = "adjective.1similar";
          writeEntry(base,type,input.adjective.sim);
        }

        if (input.adjective.rel){
          type = "adjective.1related";
          writeEntry(base,type,input.adjective.rel);
        }
        // else {
        //   var obj = {}
        //   words.push(obj);
        // }
        if (input.adjective.ant){
            type = "adjective.1antonym";
            writeEntry(base,type,input.adjective.ant);
          }
      }

      if (input.noun){
        if (input.noun.syn){
          type = "noun.2noun";
          writeEntry(base,type,input.noun.syn);
        }
        if (input.noun.sim){
          type = "noun.2similar";
          writeEntry(base,type,input.noun.sim);
        }
        if (input.noun.rel){
          type = "noun.2related";
            writeEntry(base,type,input.noun.rel);
        }
        if (input.noun.ant){
            type = "noun.2antonym";
            writeEntry(base,type,input.noun.ant);
          }
      }

      if (input.verb){
        if (input.verb.syn){
          type = "verb.3verb";
          writeEntry(base,type,input.verb.syn);
        }
        if (input.verb.sim){
          type = "verb.3similar";
          writeEntry(base,type,input.verb.syn);
        }
        if (input.verb.rel){
          type = "verb.3related";
            writeEntry(base,type,input.verb.rel);
        }
        if (input.verb.ant){
            type = "verb.3antonym";
            writeEntry(base,type,input.verb.ant);
          }
      }

console.log("ahsdhajhdksa",words);
      return words;
      }
  },

  toProperCase: function(input){
  var errorObject = {}
  var errorCode = 0;

  if (input.length === 0){
    return "";
  } else {
    var firstChar = input[0].toUpperCase();
    input = input.substr(1,input.length);
    input = input.toLowerCase();
    input = firstChar + input;
    return input;
  }
},

emailValidate: function(currentUser, password, confirm, duplicate){
  var errorObject = []
  var errorCode = 0;

  if (currentUser === ""){
    errorObject.push("Username Cannot be Blank.");
    errorCode += 1;
  } else {
    errorCode += 0;
  }

  if (password.length === 0){
    errorObject.push("Password Cannot be Blank.");
    errorCode += 1;
  } else {
    errorCode += 0;
  }

  if (password.length < 3){
    errorObject.push("Password Cannot be less than 3 characters.");
    errorCode += 1;
  } else {
    errorCode += 0;
  }

  if (password !== confirm){
    errorObject.push("Passwords do not match.");
    errorCode += 1;
  } else {
    errorCode += 0;
  }

  if (duplicate >= 1){
    errorObject.push("Account for this user name already exists.");
    errorCode += 1;
  } else {
    errorCode += 0;
  }
  return {errors: errorObject, errorStatus: errorCode};
},

  duplicates: function(currentUser,callback){
    var db = require('monk')(process.env.MONGOLAB_URI);
    var userCollection = db.get('words_users');

    userCollection.find({username: currentUser}, function(err, user){
      // console.log(user.length);
      var duplicate = 0;
          if (user.length === 0){
            duplicate += 0
          } else {
            duplicate += 1;
          }
    callback(duplicate);
    })
  }
}
