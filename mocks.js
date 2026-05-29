// mocks.js
global.SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: (name) => ({
      getRange: (rangeStr) => ({
        getValues: () => [["Fountain Pen Repair"], ["eBay Reseller"], ["Coffee Roasting"]],
        setValue: jest.fn(),
        setValues: jest.fn(),
        clearContent: jest.fn()
      }),
      insertSheet: jest.fn(() => ({
        appendRow: jest.fn(),
        getRange: jest.fn(() => ({
          setFontWeight: jest.fn(() => ({ setBackground: jest.fn() }))
        })),
        insertRowsAfter: jest.fn(),
        getLastRow: () => 10,
        deleteRows: jest.fn()
      }))
    }),
    getActiveSheet: () => ({
      getRange: (rangeStr) => ({
        clearContent: jest.fn(),
        setValue: jest.fn(),
        setValues: jest.fn(),
        getValue: () => "Mocked Option"
      }),
      flush: jest.fn()
    })
  }),
  flush: jest.fn()
};

global.PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key) => `mock_key_for_${key}`
  })
};

global.UrlFetchApp = {
  fetch: jest.fn(() => ({
    getContentText: () => JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify([
              { index: 1, caption: "Mocked AI Caption 1" },
              { index: 2, caption: "Mocked AI Caption 2" }
            ])
          }]
        }
      }]
    })
  }))
};