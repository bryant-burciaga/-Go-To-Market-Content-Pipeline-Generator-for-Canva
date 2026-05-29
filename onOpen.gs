/**
 * Automatically runs when the Spreadsheet is opened.
 * Creates a custom menu interface for the Content Engine pipeline.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🚀 Content Engine')
    .addItem('Generate Daily Ideas', 'SidehustleIdeaOftheDay')
    .addItem('Generate POV Video Layouts', 'GenerateCanvaPOVVideoEngineBulk')
    .addItem('Generate Random Hustles', 'generateSevenRandomHustles')
    .addItem('Generate Bulk Factoids', 'GenerateDidYouKnowFactoidsBulk')
    .addToUi();
}