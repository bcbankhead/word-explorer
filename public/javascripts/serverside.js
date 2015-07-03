module.exports = {

  updateData: function(currentUser, theWord){
    var db = require('monk')(process.env.MONGOLAB_URI);
    var userCollection = db.get('words_users');

    userCollection.update(
    { username: currentUser },
    { $pull: { words: theWord } });

    userCollection.update(
    { username: currentUser },
    { $pull: { words: '' } });

    userCollection.update(
    { username: currentUser },
    { $push: { words: theWord } });

    userCollection.update(
    { username: currentUser },
    { $push: { words: { $each: [ ], $sort: 1 } } })

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

    if(data){
      if(data.results){
        if(data.results.length > 0){
          if(data.results[0].pronunciations){
            if(data.results[0].pronunciations.length > 0){
              if(data.results[0].pronunciations[0].ipa){
                result.ipa = data.results[0].pronunciations[0].ipa;
                console.log("IPAIPAIPA***********",result.ipa);
              }
            }
          }
          if(data.results[0].senses.length > 0){
            if(data.results[0].senses[0].definition){
              var pearsonDef = data.results[0].senses[0].definition[0];
              result.definition = data.results[0].senses[0].definition[0];
              console.log("DEFDEFDEF***********",result.definition);
            }
          }
        }
      }
      return result;
    } else {
      return undefined;
    }
  },

  getData: function(url,callback){
    var unirest = require('unirest');
    unirest.get(url).end(function (response) {
        callback(response.body);
    })
  },

  parseWordNik: function(definition){
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
        typeArray[i] = typeArray[i].replace(/\s/g,"-");
        obj.imports.push("words." + base + "." + typeArray[i])
      }
      words.push(obj);

      for (var i =0; i < typeArray.length;i++){
        var obj = {}
        typeArray[i] = typeArray[i].replace(/\s/g,"-");
        obj.name = "words." + base + "." + typeArray[i];
        obj.size = 1;
        obj.imports = []
        words.push(obj);
      }
    };

      var adjectives = [];
      var nouns = [];
      var verbs = [];
      var words = [];
      var compared = [];

    if(input){
      if (input.adjective){
        type = "adjective";
        if (input.adjective.syn){
          writeEntry(base,type,input.adjective.syn);
        } else if (input.adjective.sim){
          writeEntry(base,type,input.adjective.sim);
        } else {
          var obj = {}
          words.push(obj);
        }
      }

      if (input.noun){
        type = "noun";
        if (input.noun.syn){
          writeEntry(base,type,input.noun.syn);
        } else if (input.noun.sim){
          writeEntry(base,type,input.noun.syn);
        } else {
          var obj = {}
          words.push(obj);
        }
      }

      if (input.verb){
        type = "verb";
        if (input.verb.syn){
          writeEntry(base,type,input.verb.syn);
        } else if (input.noun.sim){
          writeEntry(base,type,input.verb.syn);
        } else {
          var obj = {}
          words.push(obj);
        }
      }
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
      console.log(user.length);
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
