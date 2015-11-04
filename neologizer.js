/* Neologizer analyzes the structure of words in a given text and uses what it
learns to make up new words. You may find a practical use for such neologizing
(filler text, brand naming, etc.), but mostly it's just fun.
*/
var Neologizer = (function () {
	"use strict";

	var INPUT_FIELD_ID = "input";
	var OUTPUT_FIELD_ID = "output";
	var MAX_PASSES = 1000;
	var MAX_WORD_LEN = 100;

	// Determine whether a given string contains a letter.
	var is_alpha = function (text) {
		return (text.toLowerCase() !== text.toUpperCase());
	};

	// Shuffle a given array in place using the Fisher-Yates algorithm.
	var shuffle = function (list) {
		for (var i = list.length - 1; i > 0; i--) {
			var iSwap = Math.floor(Math.random()*(i + 1));
			var temp = list[i];
			list[i] = list[iSwap];
			list[iSwap] = temp;
		}
	};

	// Convert a given selection of text into an array containing its words.
	var list_words = function (input_text) {
		// If no input text was supplied, take it from the input field.
		if (typeof input_text === "undefined") {
			var input_field = document.getElementById(INPUT_FIELD_ID);
			if (input_field) {
				input_text = input_field.value;
			} else {
				input_text = "";
			}
		}

		// Convert the input text and return it as an array of words.
		var output_text = '';
		var input_len = input_text.length;
		for (var i = 0; i < input_len; i++) {
			if (is_alpha(input_text[i])) {
				output_text += input_text[i].toLowerCase();
			} else {
				output_text += " ";
			}
		}
		output_text = output_text.replace(/  +/g, " ").trim();
		return output_text.split(" ");
	};

	// Return a list of 3-letter rules for letters sequences.
	var list_rules = function (word_list) {
		// If no word list was supplied, extract it from the input field.
		if (typeof word_list === "undefined") {
			word_list = list_words();
		}

		// Using the underscore as a word boundary, collect all 3-grams.
		var rule_list = []
		var word_count = word_list.length;
		for (var iWord = 0; iWord < word_count; iWord++) {
			var word = word_list[iWord];
			var word_len = word.length;
			for (var iChar = 0; iChar < word_len; iChar++) {
				var rule = "";
				if (iChar === 0) {
					rule += "_";
				} else {
					rule += word[iChar - 1];
				}
				rule += word[iChar];
				if (iChar === word_len - 1) {
					rule += "_";
				} else {
					rule += word[iChar + 1];
				}
				rule_list.push(rule);
			}
		}
		return rule_list;
	};

	// Return a list of neologisms based on discovered rules.
	var neologize = function (word_list) {
		// If no word list was supplied, extract it from the input field.
		if (typeof word_list === "undefined") {
			word_list = list_words();
		}

		// Generate some rules for word construction.
		var rule_list = list_rules(word_list);

		var new_word_list = [];
		for (var i = 0; i < MAX_PASSES; i++) {
			// Piece together bits from random rules until a word is formed.
			var target = "_";
			var chunk = "";
			do { 
				shuffle(rule_list);

				var state = "error";

				// Step through the 3-letter rules until a match is found.
				var rule_count = rule_list.length;
				for (var iRule = 0; iRule < rule_count; iRule++) {
					var rule = rule_list[iRule];
					if (target === rule[0]) {
						// This condition is only met at the start of a word.
						target = rule.substr(1, 2);
						chunk = target[0];
						state = "match";
					} else if (target === rule.substr(0, 2)) {
						target = rule.substr(1, 2);
						state = "match";
					}
					if (state === "match") {
						chunk += target[1];
						state = "working";
						break;
					}
				}

				// Check for a generated word of acceptable length.
				var chunk_len = chunk.length;
				if (chunk_len > MAX_WORD_LEN) {
					state = "error";
				} else if (chunk_len > 1 && chunk[chunk_len - 1] === "_") {
					// If another word boundary is found, the word is complete!
					state = "success";
				}
			} while (state === "working");

			if (state === "success") {
				var new_word = chunk.slice(0, -1);
				if (
					new_word_list.indexOf(new_word) === -1
					&& word_list.indexOf(new_word) === -1
				) {
					new_word_list.push(new_word);
				}
			}
		}
		return new_word_list;
	};
	
	// Display supplied text in the output field or the console.
	var show_output = function (output_text) {
		var output_field = document.getElementById(OUTPUT_FIELD_ID);
		if (output_field) {
			output_field.innerHTML = output_text;
		} else {
			console.log(output_text);
		}
	};
	
	// List the neologisms generated from the input text.
	var generate = function () {
		show_output(neologize().join(", "));
	};
	
	// Replace the words in the input text with neologisms.
	var convert = function () {
		
	};
	
	// Return a public interface for this module.
	return {
		generate: generate,
		convert: convert
	};
})();