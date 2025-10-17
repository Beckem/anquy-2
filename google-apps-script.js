// Google Apps Script code for handling RSVP form submissions
// To use this:
// 1. Go to https://script.google.com/
// 2. Create a new project
// 3. Replace the default code with this code
// 4. Deploy as a web app with execute permissions for "Anyone"
// 5. Copy the web app URL and replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' in index.html

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Get or create the spreadsheet
    const sheet = getOrCreateSheet();

    // Add headers if this is the first row
    if (sheet.getLastRow() === 0) {
      sheet
        .getRange(1, 1, 1, 4)
        .setValues([["Tên", "Tham gia", "Lời chúc", "Thời gian"]]);
    }

    // Add the new data
    const newRow = [
      data.name,
      data.attendance === "yes" ? "Có" : "Không",
      data.wishes || "",
      new Date(data.timestamp).toLocaleString("vi-VN"),
    ];

    sheet.appendRow(newRow);

    // Return success response
    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  // Try to get existing spreadsheet by name
  const spreadsheetName = "An Invitation";
  let spreadsheet;

  try {
    const files = DriveApp.getFilesByName(spreadsheetName);
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.open(files.next());
    } else {
      // Create new spreadsheet
      spreadsheet = SpreadsheetApp.create(spreadsheetName);
    }
  } catch (error) {
    // If there's an error, create a new spreadsheet
    spreadsheet = SpreadsheetApp.create(spreadsheetName);
  }

  // Get the first sheet
  let sheet = spreadsheet.getSheets()[0];

  // Rename the sheet if needed
  if (sheet.getName() !== "Sheet1") {
    sheet.setName("Sheet1");
  }

  return sheet;
}

// Test function to verify the script works
function testFunction() {
  const testData = {
    name: "Test User",
    attendance: "yes",
    wishes: "Chúc mừng cặp đôi!",
    timestamp: new Date().toISOString(),
  };

  const result = doPost({
    postData: {
      contents: JSON.stringify(testData),
    },
  });

  console.log(result.getContent());
}
