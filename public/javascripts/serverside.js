module.exports = {

  parseObject: function(definition){
    if (definition.length > 0 || definition[0] != null || definition[0] != ''){
      var definition = definition[0].text;
    } else {
      var definition = 0;
    }
    return {definition: definition}
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

emailValidate: function(currentUser, password, duplicate){
  var errorObject = {}
  var errorCode = 0;

  if (currentUser === ""){
    errorObject.error1 = "Username Cannot be Blank";
    errorCode += 1;
  } else {
    errorObject.error1 = "";
    errorCode += 0;
  }

  if (password.length === 0){
    errorObject.error2 = "Password Cannot be Blank";
    errorCode += 1;
  } else {
    errorObject.error2 = "";
    errorCode += 0;
  }

  if (password.length < 3){
    errorObject.error3 = "Password Cannot be less than 3 characters";
    errorCode += 1;
  } else {
    errorObject.error3 = "";
    errorCode += 0;
  }

  if (duplicate >= 1){
    errorObject.error4 = "Account for this user name already exists";
    errorCode += 1;
  } else {
    errorObject.error4 = "";
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