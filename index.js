const { google } = require("googleapis");
const Automate = require("./automate.js");
async function start() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = "12yh7I3kip91czGCTV0mPE3ce9fJr0vyi8mwPvJma7kI";

    // Get metadata about spreadsheet

    // Read rows from spreadsheet
    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Receipt",
    });
    // console.log(getRows);
    var filteredRow = [];
    var filteredIndexes = [];
    var start,
      fast,
      slow = 0;
    var count = 1;
    var flag = false;
   //Filter rows where RV number not in row and catch there indexes
    for (const row of getRows.data.values) {
      if (!row[8]) {
        if (flag == false) {
          start = slow = count;
          flag = true;
        }
        if (flag == true) {
          if (count == slow + 1) {
            slow = count;
          } else {
            filteredIndexes.push([start, count]);
            flag = false;
            start = slow = count;
          }
        }
        filteredRow.push(row);
      }
      count = count + 1;
    }
    return [getRows.data.values,filteredRow, filteredIndexes];
  } catch (err) {
    console.log("ERR: ", err);

  }
}
async function update(data) {
  //Update RV cells and from posted data of automate.js
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const spreadsheetId = "12yh7I3kip91czGCTV0mPE3ce9fJr0vyi8mwPvJma7kI";
  var res = {
    spreadsheetId,
    requestBody: { data, valueInputOption: "USER_ENTERED" },
  };

  const updated = await googleSheets.spreadsheets.values.batchUpdate(res);
}
async function writeFile(data){
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
      });
    
      const client = await auth.getClient();
    
      // Instance of Google Sheets API
      const googleSheets = google.sheets({ version: "v4", auth: client });
      var spreadsheetId = "12yh7I3kip91czGCTV0mPE3ce9fJr0vyi8mwPvJma7kI";

      const response=await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range:"Receipt-Done",
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource:{
            values:data
        },
      })


}
start().then(async(allrows) => {
 
  //Send all rows and their indexes
//   values = await Automate(allrows[0], allrows[1]);
// console.log(allrows)
values= await Automate(allrows[1],allrows[2])
// console.log(values)
  // console.log(allrows[0])
var toupdate=[]
  for(var i=0;i<values.length;i++){
    if(!allrows[0][values[i][1][1]-1][7]){
    allrows[0][values[i][1][1]-1].push("")
    }
    allrows[0][values[i][1][1]-1].push(values[i][0])
    toupdate.push(allrows[0][values[i][1][1]-1])
  }

  // console.log(allrows[0])
  // console.log(values)


 await writeFile(toupdate)
var data = [];
// for(var i=0;i<values[1].length;i++){
    
// }
  for (var i = 0; i < values.length; i++) {
    data.push({
      range: `Receipt!I${values[i][1][1]}:I${values[i][1][1]}`,
      values: [[values[i][0]]],
    });
  }
  

  await update(data);
  process.exit(0);
});