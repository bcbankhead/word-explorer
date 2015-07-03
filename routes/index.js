var express = require('express');
var bcrypt = require('bcryptjs');
var unirest = require('unirest');

var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI);
var userCollection = db.get('words_users');
var wordCollection = db.get('words_words');

var api1 = (process.env.wordnik);
var api2 = (process.env.dictionary);
var api3 = (process.env.thesaurus);
var api4 = (process.env.pearson_consumer);

var functions = require('../public/javascripts/serverside.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  var cookieUser = req.cookies.user;
  var response = req.body.response;

  if(!cookieUser || cookieUser === 'new'){
    res.render('index', { currentUser: 'new'});
  } else {
    userCollection.findOne({username: cookieUser}, function(err, dataset){
      res.render('words/index', { currentUser: cookieUser, data: dataset });
    });
  }
});

router.post('/words', function(req, res, next) {
  var currentUser = req.cookies.user;
  var theWord = req.body.word.replace(/\-/g," ");
      theWord = theWord.toLowerCase();
  var notavail = 0;
  var thesaurusObj = {};
  var definitions = {};

  var wordNikAPI = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/definitions?limit=200&includeRelated=true&sourceDictionaries=ahd&useCanonical=false&includeTags=false&api_key=" + api1;
  var synonymsAPI = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/relatedWords?useCanonical=false&relationshipTypes=synonym&limitPerRelationshipType=10&api_key=" + api1;
  var entomologyAPI = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/etymologies?useCanonical=false&api_key=" + api1;
  var dictionaryAPI = "http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/" + theWord + "?key=" + api2;
  var thesaurusAPI = "http://words.bighugelabs.com/api/2/" + api3 + "/" + theWord + "/json";
  var pearsonAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;
  //var yandexAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;

  functions.getData(thesaurusAPI, function(thesaurusResult){
    functions.getData(wordNikAPI, function(definition){
      functions.getData(pearsonAPI, function(definitionPearson){

        var pearsonResult = functions.pearsonData(definitionPearson);
        if(pearsonResult){
          if(pearsonResult.headword){
            var pearsonHW = pearsonResult.headword;
          } else {
            var pearsonHW = "No pronunciation data."
          }
          if(pearsonResult.ipa){
            var pearsonIPA = pearsonResult.ipa;
          } else {
            var pearsonIPA = "No pronunciation data."
          }
          if(pearsonResult.definition){
            var pearsonDef = pearsonResult.definition;
            pearsonDef = functions.toProperCase(pearsonDef);
          }
        }

        if(definition){
          if(definition.length > 0){
            var wordNikDef = functions.parseWordNik(definition);
          }
        } else {
          userCollection.findOne({username: currentUser}, function(err, dataset){
            theWord = functions.toProperCase(theWord);
            res.render('words/index', { word: theWord, currentUser: currentUser, data: dataset, errorMsg: "Word field is blank.(001)" });
          });
        }

        if (thesaurusResult != undefined){
          thesaurusResult = JSON.parse(thesaurusResult);
          thesaurusObj = functions.trParse(theWord,thesaurusResult);
          thesaurusObj = JSON.stringify(thesaurusObj)
          notavail = 0;
        } else if (thesaurusResult == undefined) {
          notavail = 1;
          if(currentUser != 'new' || currentUser != null){
            userCollection.findOne({username: currentUser}, function(err, dataset){
              theWord = functions.toProperCase(theWord);
              res.render('words/index', { word: theWord, ipa: pearsonIPA, currentUser: currentUser, data: dataset, errorMsg: "No records found in thesaurus.(002)" });
            });
          } else {
            res.render('words/index', { word: theWord, ipa: pearsonIPA, errorMsg: "No records found in thesaurus.(003)" });
          }
        }

        var definitions = functions.defCollect(wordNikDef,pearsonDef);

        //Write dataEntry for Database
        theWord = functions.toProperCase(theWord);
        if (theWord.length > 0 && notavail === 0){
          if (currentUser !== 'new' || currentUser != '' || currentUser != null){

            // wordCollection.update(
            // { word: theWord },
            // {
            //   word: theWord,
            //   ipa: pearsonIPA
            // },
            // { upsert: true });

            userCollection.update(
            { username: currentUser },
            { $pull: { words: theWord } });

            userCollection.update(
            { username: currentUser },
            { $pull: { words: '' } });

            userCollection.update(
            { username: currentUser },
            { $push: { words: theWord }});

            userCollection.update(
            { username: currentUser },
            { $push: { words: { $each: [ ], $sort: 1 } } });

            };

          if(!currentUser || currentUser === 'new'){
              res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, payload: thesaurusObj, definition: definitions, currentUser: 'new'});
          } else {
            userCollection.findOne({username: currentUser}, function(err, dataset){
              res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, payload: thesaurusObj, definition: definitions, currentUser: currentUser, data: dataset });
            });
          }
        } else {
          if(!currentUser || currentUser === 'new'){
            res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, errorMsg: "Word not located in thesaurus.(006)" });
          } else {
            userCollection.findOne({username: currentUser}, function(err, dataset){
              theWord = functions.toProperCase(theWord);
              res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, currentUser: currentUser, data: dataset, errorMsg: "Word not located in thesaurus.(007)" });
            });
          }
        }
      });
    });
  });
});

//Explorer: Display Word
router.get('/words/:word', function(req, res, next){
  var theWord = req.params.word.replace(/\-/g," ");
  theWord = theWord.toLowerCase();
  var thesaurusObj = {};
  var notavail = 0;
  var wordNikAPI = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/definitions?limit=200&includeRelated=true&sourceDictionaries=ahd&useCanonical=false&includeTags=false&api_key=" + api1;
  var synonymsAPI = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/relatedWords?useCanonical=false&relationshipTypes=synonym&limitPerRelationshipType=10&api_key=" + api1;
  var entomologyAPI = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/etymologies?useCanonical=false&api_key=" + api1;
  var dictionaryAPI = "http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/" + theWord + "?key=" + api2;
  var thesaurusAPI = "http://words.bighugelabs.com/api/2/" + api3 + "/" + theWord + "/json";
  var pearsonAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;
  //var yandexAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;

  functions.getData(thesaurusAPI, function(thesaurusResult){
    functions.getData(wordNikAPI, function(definition){
      functions.getData(pearsonAPI, function(definitionPearson){

        var pearsonResult = functions.pearsonData(definitionPearson);
        if(pearsonResult){
          if(pearsonResult.headword){
            var pearsonHW = pearsonResult.headword;
          } else {
            var pearsonHW = "No pronunciation data."
          }
          if(pearsonResult.ipa){
            var pearsonIPA = pearsonResult.ipa;
          } else {
            var pearsonIPA = "No pronunciation data."
          }
          if(pearsonResult.definition){
            var pearsonDef = pearsonResult.definition;
            pearsonDef = functions.toProperCase(pearsonDef);
          }
        }

        if(definition.length > 0){
          var wordNikDef = functions.parseWordNik(definition);
        }

        if (thesaurusResult != undefined){
          thesaurusResult = JSON.parse(thesaurusResult);
          thesaurusObj = functions.trParse(theWord,thesaurusResult);
          thesaurusObj = JSON.stringify(thesaurusObj)
          notavail = 0;
        } else if (thesaurusResult === undefined) {
          notavail = 1;
        }

        var cookieUser = req.cookies.user;
        if(!cookieUser){
          res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, payload: thesaurusObj, currentUser: 'new' });
        }

        var definitions = functions.defCollect(wordNikDef,pearsonDef);

        theWord = functions.toProperCase(theWord);
        if(cookieUser && notavail == 0){
          userCollection.findOne({username: cookieUser}, function(err, dataset){
            // wordCollection.update(
            // { word: theWord },
            // {
            //   word: theWord,
            //   ipa: pearsonIPA
            // },
            // { upsert: true });
          res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, payload: thesaurusObj, data: dataset, currentUser: cookieUser, definition: definitions});
          });
        } else if(cookieUser && notavail == 1){
          userCollection.findOne({username: cookieUser}, function(err, dataset){
          res.render('words/index', { word: theWord, headword: pearsonHW, ipa: pearsonIPA, payload: thesaurusObj, data: dataset, currentUser: cookieUser, errorMsg: 'Word not located in thesaurus.(009)', definition: definitions});
          });
        }
      });
    });
  });
});

//Explorer: Add word
router.get('/addword/:word', function(req, res, next) {
  var tmpWord = req.params.word;
  var avail = 0;
  if(tmpWord.charAt([tmpWord.length-1]) == "1"){
    var theWord = tmpWord.substr(0, tmpWord.length - 1);
    avail = 1;
  } else {
    var theWord = tmpWord;
  }

  var currentUser = req.cookies.user;

  //Write Entry to Database
  theWord = functions.toProperCase(theWord);
  if(avail === 0){
    if (currentUser !== 'new' || currentUser != '' || currentUser != null){

        userCollection.update(
        { username: currentUser },
        { $pull: { words: theWord } });

        userCollection.update(
        { username: currentUser },
        { $pull: { words: '' } });

        userCollection.update(
        { username: currentUser },
        { $push: { words: theWord }});

        userCollection.update(
        { username: currentUser },
        { $push: { words: { $each: [ ], $sort: 1 } } });

        res.redirect('/words/'+ theWord)
      };
  } else {
      userCollection.findOne({username: currentUser}, function(err, dataset){
        res.render('words/index', {currentUser: currentUser, data: dataset, word: theWord, errorMsg: "Word not located in thesaurus.(008)" });
      });
  }
  if (!currentUser || currentUser === 'new'){
    res.redirect('/');
  }
});

//Delete Entry
router.get('/delete/:word', function(req, res, next) {
  var tmpWord = req.params.word;
  var avail = 0;
  if(tmpWord.charAt([tmpWord.length-1]) == "1"){
    var theWord = tmpWord.substr(0, tmpWord.length - 1);
    avail = 1;
  } else {
    var theWord = tmpWord;
  }

  var currentUser = req.cookies.user;
  theWord = functions.toProperCase(theWord);

  if(avail === 0){
    if (currentUser !== 'new' || currentUser != '' || currentUser != null){
      userCollection.update(
        { username: currentUser },
        { $pull: { words: theWord } });
      userCollection.findOne({username: currentUser}, function(err, dataset){
        res.render('words/index', {currentUser: currentUser, data: dataset, word: theWord, rMsg: "Removed word: " + theWord });
      });
    };
  }
  if (!currentUser || currentUser === 'new'){
    res.redirect('/');
  }
});


//Signup
router.post('/signup', function(req, res, next){
  var currentUser = functions.toProperCase(req.body.user);
  var password = req.body.password;
  var confirm = req.body.confirm;

  functions.duplicates(currentUser, function(duplicate){
      var nameRes = functions.emailValidate(currentUser, password, confirm, duplicate);
      if (nameRes.errorStatus > 0){
        var returnValues = {}
        returnValues.username = currentUser,
        res.render('signup/index', { title: "Express", errors: nameRes.errors, posted: returnValues });
      }

      if (nameRes.errorStatus === 0){
        var passwordBcrypt = bcrypt.hashSync(req.body.password, 8);
        userCollection.insert({
          username: currentUser,
          password: passwordBcrypt,
          visitcount: 0,
        });
        res.cookie('user', currentUser)
        userCollection.findOne({username: currentUser}, function(err, dataset){
          var id = dataset._id;
          res.redirect('/profiles/'+ id);
        });
      }
  });
})

//Get Profile
router.get('/profiles/:id', function(req, res, next) {
  var cookieUser = req.cookies.user;
  if(!cookieUser){
    res.redirect('/');
  } else {
    userCollection.findOne({username: cookieUser}, function(err, dataset){
      var id = dataset._id;
      if (req.params.id != id) {
        res.redirect('/');
      } else {
        console.log(dataset.words);
        res.render('profiles/index', {currentUser: cookieUser, data: dataset});
      }
    });
  }
});

//Get Login
router.get('/login', function(req, res, next){
  var cookieUser = req.cookies.user;
  if(!cookieUser){
        res.render('login/index', {currentUser: cookieUser, currentUser: 'new'});
  } else {
  res.render('login/index', {currentUser: cookieUser});
  }
});

router.get('/signup', function(req, res, next){
  res.render('signup/index');
});

router.get('/logout', function(req, res, next) {
  res.clearCookie(req.cookies.user, {path: '/'});
  res.cookie('user', '', { expires: new Date(1), path: '/' });
  res.render('login/index', {currentUser: 'new', message: 'Logged out successfully'});
});

//Login Execution
router.post('/login', function(req, res, next){
  var currentUser = functions.toProperCase(req.body.user);
  userCollection.findOne({username: currentUser}, function(err, record){
    if (record === null){
      res.render('login/index', {currentUser: currentUser, message: "No login found for user: " + currentUser})
    } else {
      var passCompare = bcrypt.compareSync(req.body.password, record.password);
      if (passCompare === true){
        var visits = record.visitcount;
        visits++;
        userCollection.update(
          {user: currentUser },
          { visitcount: visits });
        res.cookie('user', currentUser)

        userCollection.findOne({username: currentUser}, function(err, dataset){
          var id = dataset._id;
          res.redirect('/profiles/'+ id);
        });
      } else {
        res.render('login', {message: "Username or password incorrect."})
      }
    };
  });
});

module.exports = router;
