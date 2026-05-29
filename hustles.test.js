// hustles.test.js
require('./mocks.js'); 
const fs = require('fs');
const path = require('path');

// Evaluates the helpers file directly into the local test scope
const helpersCode = fs.readFileSync(path.resolve(__dirname, './helpers.gs'), 'utf8');
eval(helpersCode); 

describe('Google Apps Script Local Content Engine Tests', () => {

  test('getMatchingEmoji() returns correct emoji for mapped keywords', () => {
    expect(getMatchingEmoji('Coffee Roasting', 1)).toBe('☕');
    expect(getMatchingEmoji('eBay Reseller', 1)).toBe('🛒');
    expect(getMatchingEmoji('Fountain Pen', 1)).toBe('✒️');
  });

  test('getMatchingEmoji() handles fallback cases correctly based on item number', () => {
    const unknownHustle = 'An Unknown Random Job';
    expect(getMatchingEmoji(unknownHustle, 1)).toBe('💡'); 
    expect(getMatchingEmoji(unknownHustle, 2)).toBe('🎯'); 
  });
  
  test('getMatchingEmoji() handles null/empty strings safely', () => {
    expect(getMatchingEmoji('', 1)).toBe('💡');
    expect(getMatchingEmoji(null, 2)).toBe('💡');
  });
});