const puppeteer = require('puppeteer');
const fs=require('fs/promises');
const { setEngine } = require('crypto');
const path = require('path');

async function delay(ms) {
    //For forcing program to wait
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
async function Continue(page) {
    //Simulate pause then wait
    await delay(3000);
    await page.keyboard.press("Tab");
  }
  

async function login(row,index,i){
    try{
    const browser = await puppeteer.launch({
        args: [
          '--window-size=1920,1080',
        ],
      });
    const page = await browser.newPage()
    await page.goto("https://quality-aviation.traacs.co/nucorelib/basic_users/login")
    
    await page.setViewport({
        width: 1920,
        height: 1080,
      });


   //Logging in and navigation
    const name="EricIT";
    const password="123456"
    
    await page.type("#txtLoginName",name);
    await page.type("#txtPassword",password);
    await Promise.all([page.click("#btnLoginSubmit"),page.waitForNavigation()])
    await page.goto("https://quality-aviation.traacs.co/square/basic_receipt_receipt/receipt/strMenuId/mnu_finance_transaction")
    const transaction=row[7]
    //Assigning all values
    const reference=row[2];
    const bank=row[3];
    const date=row[0];
    const customer=row[6];
    const amount=row[4];
    const cost_center = row[1];
    const depositor=row[5];
    const narration=`${date} ${cost_center} ${reference} ${bank} ${amount}`
    await page.type("#txaReceiptNaration",narration)
    var input = await page.$('#txtReceiptDate');
    await input.click({ clickCount: 3 })
    await page.type("#txtReceiptDate",date)
    
    await page.$eval('#cmbReceiptCostCenter', (selectElement, text) => {
        var options = selectElement.querySelectorAll('option');
        for (var option of options) {
          if (option.textContent.trim() === text) {
            option.selected = true;
            selectElement.dispatchEvent(new Event('change'));
            break;
          }
        }
      }, cost_center);
      await page.type('#txtReceiptRefernce',reference)
      await page.type("#txaReceiptNaration",narration)
      await page.type('#txtReceiptCashAccountName',bank)
      await Continue(page) 
      await page.type('#txtTelexAmountInTransactionCurrency',amount)
      await page.keyboard.press("Tab")
      if(depositor!="''"){
      await page.type("#txtTelexDepositorName",depositor)
      }
      if(transaction){
      await page.type('#txtTransactionIdTelex',transaction)
      }
      await page.$eval("a#addRecieveButton.linkAddTelex", (el) =>
        el.click()
      );
      await delay(1000)
      await page.click('#receiptadd > ul.tabsLinks > li:nth-child(2) > a');
      await page.type("#txtReceiptPartyReceivedFromName",customer);
      await Continue(page)
      var form = await page.$("#frmReceiptTabParty");
      if(form){
        var anchor = await form.$('#addRecieveButton');
        if(anchor){
          await anchor.click();
        }
      }
      await delay(1000)
      await page.click("#btnSaveReceipt");
      await delay(5000);
    
    values=[]
    const select = '#tblReceiptParty > tbody > tr.odd > td:nth-child(2)';
    var textContent = await page.$eval(select, (element) => {
      console.log("Here",element.textContent)
      return element.textContent;
    });
    var y=textContent
   
    await browser.close()
    
  }catch(err){
    console.log("Here",err)
    return 0
  }
  
  return [[y,index]]
    
}
async function Automate(rows,indexes){
  var Promises=[];
  var results=[];
  for(var i=0;i<rows.length;i++){
    //Generate Login function of each row by P
    Promises.push(login(rows[i],indexes[i],i))
  }
  //Wait for all function calls to execute concurrently
  results=await Promise.all(Promises)
  results=results.flat()
  //If any row invalid quit it
  for(var i =0;i<results.length;i++){
    if(results[i]==0){
      results.splice(i,1)
    }
  }
  // console.log(results)
  return results
  
  
}

module.exports=Automate;