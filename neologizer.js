/**
 * NEOLOGIZER by Cliff Jones Jr.
 * 
 * Neologizer analyzes the structure of words in a given text and uses what it
 * learns to make up new words. You may find a practical use for such neologizing
 * (filler text, brand naming, etc.), but mostly it's just fun.
 */
var neologizer = (function () {
  'use strict';

  var INPUT_FIELD_ID = 'input';
  var OUTPUT_FIELD_ID = 'output';
  var MAX_PASSES = 1000;
  var MAX_WORD_LEN = 12;
  var MAX_WORD_COUNT = 500;
  var SPACE_REGEX = ' \\t\\n\\r';
  var PUNC_REGEX = '`~!@#$%^&*()\\-_=+[\\]{}\\\\|;:\'",.<>\\/?0-9';
  var ERROR_NO_WORDS = 'More source text is needed to generate new words.';
  var STATE_ERROR = 0;
  var STATE_WORKING = 1;
  var STATE_MATCH = 2;
  var STATE_SUCCESS = 3;

  // Determine whether a given string contains a letter.
  var is_alpha = function (text) {
    return (text.toLowerCase() !== text.toUpperCase());
  };

  // Determine whether a given string contains a capital letter.
  var hasCapital = function (text) {
    return (text.toLowerCase() !== text);
  };

  // Return a copy of a given string with the first letter capitalized.
  var capitalize = function (text) {
    if (text) {
      return text[0].toUpperCase() + text.slice(1);
    }
    return '';
  };

  // Return a copy of a given string with HTML special characters escaped.
  var escapeHtml = function (text) {
    return text
      .replace('&', '&amp;')
      .replace('<', '&lt;')
      .replace('>', '&gt;')
      .replace(/(\r\n|[\n\r])/g, '<br />');
  };
  
  // Retrieve a random element from a given list.
  var getRandomItem = function (list) {
    return list[Math.floor(Math.random() * list.length)];
  };

  // Shuffle a given array in place using the Fisher-Yates algorithm.
  var shuffle = function (list) {
    for (var i = list.length - 1; i > 0; i--) {
      var swap = Math.floor(Math.random() * (i + 1));
      var temp = list[i];
      list[i] = list[swap];
      list[swap] = temp;
    }
  };
  
  // Retrieve the contents of the input field.
  var getInput = function () {
    var inputField = document.getElementById(INPUT_FIELD_ID);
    if (inputField) {
      return inputField.value;
    }
    return '';
  };
  
  // Display supplied text in the output field or the console.
  var showOutput = function (outputText) {
    var outputField = document.getElementById(OUTPUT_FIELD_ID);
    if (outputField) {
      outputField.innerHTML = outputText;
    } else {
      console.log(outputText);
    }
  };

  // Convert a given selection of text into an array containing its words.
  var listWords = function (inputText) {
    // If no input text was supplied, take it from the input field.
    if (typeof inputText === 'undefined') {
      inputText = getInput();
    }

    // Convert the input text and return it as an array of words.
    var outputText = '';
    var inputLen = inputText.length;
    for (var i = 0; i < inputLen; i++) {
      if (is_alpha(inputText[i])) {
        outputText += inputText[i].toLowerCase();
      } else {
        outputText += ' ';
      }
    }
    outputText = outputText.replace(/  +/g, ' ').trim();
    return outputText.split(' ');
  };

  // Return a list of 3-letter rules for letters sequences.
  var listRules = function (wordList) {
    // If no word list was supplied, extract it from the input field.
    if (typeof wordList === 'undefined') {
      wordList = listWords();
    }

    // Using the underscore as a word boundary, collect all 3-grams.
    var ruleList = []
    var word_count = wordList.length;
    for (var wordNum = 0; wordNum < word_count; wordNum++) {
      var word = wordList[wordNum];
      var wordLen = word.length;
      for (var charNum = 0; charNum < wordLen; charNum++) {
        var rule = '';
        if (charNum === 0) {
          rule += '_';
        } else {
          rule += word[charNum - 1];
        }
        rule += word[charNum];
        if (charNum === wordLen - 1) {
          rule += '_';
        } else {
          rule += word[charNum + 1];
        }
        ruleList.push(rule);
      }
    }
    return ruleList;
  };

  // Return a list of neologisms based on discovered rules.
  var neologize = function (wordList) {
    // If no word list was supplied, extract it from the input field.
    if (typeof wordList === 'undefined') {
      wordList = listWords();
    }

    // Generate some rules for word construction.
    var ruleList = listRules(wordList);

    var newWordList = [];
    for (var i = 0; i < MAX_PASSES; i++) {
      // Piece together bits from random rules until a word is formed.
      var target = '_';
      var chunk = '';
      do { 
        shuffle(ruleList);

        var state = STATE_ERROR;

        // Step through the 3-letter rules until a match is found.
        var rule_count = ruleList.length;
        for (var ruleNum = 0; ruleNum < rule_count; ruleNum++) {
          var rule = ruleList[ruleNum];
          if (target === rule[0]) {
            // This condition is only met at the start of a word.
            target = rule.substr(1, 2);
            chunk = target[0];
            state = STATE_MATCH;
          } else if (target === rule.substr(0, 2)) {
            target = rule.substr(1, 2);
            state = STATE_MATCH;
          }
          if (state === STATE_MATCH) {
            chunk += target[1];
            state = STATE_WORKING;
            break;
          }
        }

        // Check for a generated word of acceptable length.
        var chunkLen = chunk.length;
        if (chunkLen > MAX_WORD_LEN) {
          state = STATE_ERROR;
        } else if (chunkLen > 1 && chunk[chunkLen - 1] === '_') {
          // If another word boundary is found, the word is complete!
          state = STATE_SUCCESS;
        }
      } while (state === STATE_WORKING);

      // If a new word was successfully generated, at it to the list.
      if (state === STATE_SUCCESS) {
        var newWord = chunk.slice(0, -1);
        if (
          newWordList.indexOf(newWord) === -1
          && wordList.indexOf(newWord) === -1
        ) {
          newWordList.push(newWord);
        }
        
        // Quit generating words when a limit is reached.
        if (newWordList.length >= MAX_WORD_COUNT) {
          break;
        }
      }
    }
    return newWordList;
  };
  
  // List the neologisms generated from the input text.
  var generate = function () {
    var html = neologize().join('</li><li>');
    if (html) {
      html = '<ol><li>' + html + '</li></ol>';
    }
    showOutput(html);
    
    // If there is no output to display, show an error message instead.
    if (html === '') {
      alert(ERROR_NO_WORDS);
    }
  };
  
  // Replace the words in the input text with neologisms.
  var convert = function () {
    var newWordList = neologize();
    
    // If there is no output to display, show an error message instead.
    if (!newWordList.length) {
      showOutput('');
      alert(ERROR_NO_WORDS);
      return;
    }
    
    // Replace a found word, maintaining capitalization, punctuation, etc.
    var replaceWord = function (match, prefix, word, suffix, space) {
      var newWord = getRandomItem(newWordList);
      if (hasCapital(word)) {
        newWord = capitalize(newWord);
      }
      return prefix + newWord + suffix + space;
    };
    
    // Fetch the input text, replace its words, and output the result.
    var text = getInput();
    var re = '([' + PUNC_REGEX + ']*)' // Leading punctuation.
      + '([^' + SPACE_REGEX + ']+?)' // The word to replace.
      + '([' + PUNC_REGEX + ']*)' // Trailing punctuation.
      + '([' + SPACE_REGEX + ']+|$)'; // Trailing space.
    text = text.replace(new RegExp(re, 'g'), replaceWord);
    showOutput(escapeHtml(text));
  };
  
  // Return a public interface for this module.
  return {
    generate: generate,
    convert: convert
  };
})();
