var express = require('express');
var bcrypt = require('bcryptjs');
var unirest = require('unirest');
//var fs = require('fs');
var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI);
var userCollection = db.get('words_users');

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
  var visits = parseInt(req.body.visits,10);
  var notavail = 0;
  var thesaurusObj = {};
  theWord = theWord.toLowerCase();

  var definitionURL = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/definitions?limit=200&includeRelated=true&sourceDictionaries=ahd&useCanonical=false&includeTags=false&api_key=" + api1;
  var synonymsURL = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/relatedWords?useCanonical=false&relationshipTypes=synonym&limitPerRelationshipType=10&api_key=" + api1;
  var entomologyURL = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/etymologies?useCanonical=false&api_key=" + api1;
  var dictionaryAPI = "http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/" + theWord + "?key=" + api2;
  var thesaurusAPI = "http://words.bighugelabs.com/api/2/" + api3 + "/" + theWord + "/json";
  var pearsonAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;
  //var yandexAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;

      unirest.get(thesaurusAPI).end(function (response) {
          var thesaurusResult = response.body;
        unirest.get(definitionURL).end(function (response) {
              var definition = response.body;
      if(definition){
        if(definition.length > 0){
          var wordNikResult = functions.parseObject(definition);
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
            res.render('words/index', { word: theWord, currentUser: currentUser, data: dataset, errorMsg: "No records found in thesauri.(002)" });
          });
        } else {
          res.render('words/index', { word: theWord, errorMsg: "No records found in thesauri.(003)" });
        }
      }

      theWord = functions.toProperCase(theWord);
      if (theWord.length > 0 && notavail === 0){
        if (currentUser !== 'new' || currentUser != '' || currentUser != null){
          visits += 1;
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
            {
              $push: { words: { $each: [ ], $sort: 1 } }
            })
          };

          if(!currentUser || currentUser === 'new'){
            if(wordNikResult){
              res.render('words/index', { word: theWord, payload: thesaurusObj, definition: wordNikResult, currentUser: 'new'});
            } else {
              res.render('words/index', { word: theWord, payload: thesaurusObj, currentUser: 'new'});
            }
          } else {
            userCollection.findOne({username: currentUser}, function(err, dataset){
            theWord = functions.toProperCase(theWord);
              if(wordNikResult){
                res.render('words/index', { word: theWord, payload: thesaurusObj, definition: wordNikResult, currentUser: currentUser, data: dataset });
              } else {
                res.render('words/index', { word: theWord, payload: thesaurusObj, currentUser: currentUser, data: dataset });
              }
          });
          }
        } else {
          console.log(currentUser);
          if(!currentUser || currentUser === 'new'){
            res.render('words/index', { word: theWord, errorMsg: "Word not located in thesauri.(006)" });
          } else {
            userCollection.findOne({username: currentUser}, function(err, dataset){
              theWord = functions.toProperCase(theWord);
              res.render('words/index', { word: theWord, currentUser: currentUser, data: dataset, errorMsg: "Word not located in thesauri.(007)" });
            });
          }
        }
      });
  });
});

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
        res.render('words/index', {currentUser: currentUser, data: dataset, word: theWord, errorMsg: "Word not located in thesauri.(008)" });
      });
    }
    if (!currentUser || currentUser === 'new'){
      res.redirect('/');
    }
});

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


router.get('/words/:word', function(req, res, next) {
  var theWord = req.params.word.replace(/\-/g," ");
  var thesaurusObj = {};
  var notavail = 0;
  theWord = theWord.toLowerCase();
  var definitionURL = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/definitions?limit=200&includeRelated=true&sourceDictionaries=ahd&useCanonical=false&includeTags=false&api_key=" + api1;
  var synonymsURL = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/relatedWords?useCanonical=false&relationshipTypes=synonym&limitPerRelationshipType=10&api_key=" + api1;
  var entomologyURL = "http://api.wordnik.com:80/v4/word.json/" + theWord + "/etymologies?useCanonical=false&api_key=" + api1;
  var dictionaryAPI = "http://www.dictionaryapi.com/api/v1/references/thesaurus/xml/" + theWord + "?key=" + api2;
  var thesaurusAPI = "http://words.bighugelabs.com/api/2/" + api3 + "/" + theWord + "/json";
  var pearsonAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;
  //var yandexAPI = "https://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=" + theWord + "&apikey=" + api4;

      unirest.get(thesaurusAPI).end(function (response) {
          var thesaurusResult = response.body;
        unirest.get(definitionURL).end(function (response) {
              var definition = response.body;
      if(definition.length > 0){
        var wordNikResult = functions.parseObject(definition);
      }

      if (thesaurusResult != undefined){
        thesaurusResult = JSON.parse(thesaurusResult);
        thesaurusObj = functions.trParse(theWord,thesaurusResult);
        thesaurusObj = JSON.stringify(thesaurusObj)
        notavail = 0;
      } else if (thesaurusResult === undefined) {
        theWord = functions.toProperCase(theWord);
        notavail = 1;
      }

        var cookieUser = req.cookies.user;
        console.log("#$#$#$#$#$#",cookieUser);
        if(!cookieUser){
          res.render('words/index', { word: theWord, payload: thesaurusObj, currentUser: 'new' });
        }

        if(cookieUser && notavail == 0){
          userCollection.findOne({username: cookieUser}, function(err, dataset){
            theWord = functions.toProperCase(theWord);
            if(wordNikResult){
              res.render('words/index', { word: theWord, payload: thesaurusObj, data: dataset, currentUser: cookieUser, definition: wordNikResult});
            } else {
              res.render('words/index', { word: theWord, payload: thesaurusObj, data: dataset, currentUser: cookieUser});
            }
          });
        } else if(cookieUser && notavail == 1){
          userCollection.findOne({username: cookieUser}, function(err, dataset){
            console.log(dataset);
          theWord = functions.toProperCase(theWord);
          if(wordNikResult){
            res.render('words/index', { word: theWord, payload: thesaurusObj, data: dataset, currentUser: cookieUser, errorMsg: 'Word not located in thesauri.(009)', definition: wordNikResult});
          } else {
            res.render('words/index', { word: theWord, payload: thesaurusObj, data: dataset, currentUser: cookieUser, errorMsg: 'Word not available in either source.(010)'});
          }
        });
        }
      });
  });
});

router.post('/signup', function(req, res, next){
  var currentUser = functions.toProperCase(req.body.user);
  var password = req.body.password;

  functions.duplicates(currentUser, function(duplicate){

      var nameRes = functions.emailValidate(currentUser, password, duplicate);

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
    userCollection.update({
        user: currentUser
      },
      {
        visitcount: visits
      });
    res.cookie('user', currentUser)
    userCollection.findOne({username: currentUser}, function(err, dataset){
      var id = dataset._id;
      res.redirect('/profiles/'+ id);
    });
  } else {
    res.redirect('/failure')
    console.log("fail");
  }
}
})
})

module.exports = router;
