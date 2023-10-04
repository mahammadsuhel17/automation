import React, { useState } from "react";
import './App.css'
// import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx'
import moment from "moment/moment";
import upload from './Assets/upload.png'
import LoadingSpinner from "./LoadingSpinner";

const App = () => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [excelData, setExcelData] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showExportButton, setShowExportButton] = useState(false)
  const [showLoader, setShowLoader] = useState(false)
  const [completedFiles, setcompletedFiles] = useState(null)
  const [totalFiles, setTotalFiles] = useState(0)


  const handleFileSelect = async (e) => {
    const files = e.target.files;
    setTotalFiles(files.length)
    if (files && files.length > 0) {
      setShowExportButton(false)
      setShowLoader(true)
      const convertedDataArray = [];
      setExcelData([])
      for (let i = 0; i <= files.length; i++) {
        // console.log("pregresss",(i/files.length)*100 );
        setProgress(`${((i / files.length) * 100).toFixed()}%`)
        setcompletedFiles(i)
        const file = files[i];
        try {
          const data = await readFileAsync(file);
          const workbook = XLSX.read(data, { type: 'binary' });

          // Assuming you want to convert the first sheet to JSON
          const sheetName = workbook.SheetNames;
          await sheetName.forEach(async (sheetName) => {
            if (sheetName === "TOTAL") {
              // console.log("sheetName==>jhjkghsjhG", sheetName);
              const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                raw: false, // Interpret dates as JavaScript dates
                dateNF: new Date(), // Format for parsing dates (adjust as needed)
              });

              const data1 = []
              const startDateOld = new Date(moment(fromDate).format('yyyy-MM-DD')); // October 1, 2023
              const endDate = new Date(moment(toDate).format('yyyy-MM-DD'));

              const oneDayMilliseconds = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
              const startDate = new Date(startDateOld - oneDayMilliseconds);

              // console.log("sheetData==>", typeof(startDate), endDate, sd);
              await sheetData.map(async (val) => {
                if (val?.Date && val?.Date !== "Total" && val[" Adjusted Billable Spend "] && val[" Adjusted Profit "]) {
                  const itemDateParts = val?.Date.split('-');
                  const itemYear = new Date(fromDate).getFullYear() 
                  const itemMonth = itemDateParts[1].toLowerCase(); // Convert to lowercase for consistency
                  const itemDay = parseInt(itemDateParts[0]);

                  const itemJavaScriptDate = new Date(`${itemYear}-${itemMonth}-${itemDay}`);
                  // console.log("itemJavaScriptDate", itemJavaScriptDate, startDate);
                  // console.log("itemJavaScriptDate", itemYear, itemDateParts, `2023-${itemMonth}-${itemDay}`);
                  if (itemJavaScriptDate >= startDate && itemJavaScriptDate <= endDate) {
                    console.log("itemJavaScriptDate",moment(new Date(val?.Date)).format("DD-MMM")  );
                    const finelData = {
                      "Spend Sheet Name": file?.name,
                      "Date": moment(new Date(val?.Date)).format("DD-MMM"),
                      "Adjusted Billable Spend": val[" Adjusted Billable Spend "],
                      "Adjusted Profit": val[" Adjusted Profit "]
                    }
                    // console.log("sasasasas", finelData);
                    data1.push(finelData)
                    // return finelData
                  }
                }
              })
              // console.log('Converted Excel data ===>:', data1);
              const newData = await data1.filter((item) => {
                if (item !== undefined) {
                  return item
                }
              })
              // console.log("DDFLJKDJKDJ ===>", newData);
              convertedDataArray.push(data1);
            }
          })
          // Store the converted JSON data in an array

        } catch (error) {
          console.error(`Error converting Excel file ${file?.name} to JSON:`, error);
        }
      }

      // Set the array of converted JSON data in state
      console.log("convertedDataArray===>", [].concat(...convertedDataArray));
      setExcelData([].concat(...convertedDataArray));
      setShowExportButton(true)
      setShowLoader(false)
    }
  };

  const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        resolve(event.target.result);
      };

      reader.onerror = (event) => {
        reject(event.target.error);
      };

      reader.readAsBinaryString(file);
    });
  };


  const handleExportExcel = () => {
    const dd = [].concat(...excelData)
    const worksheet = XLSX.utils.json_to_sheet(dd);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "DataSheet.xlsx", { type: 'binary', bookType: 'xlsx', cellDates: true });
  }

  return (
    <div className='container'>
      <div className='datePickerView'>
        <div className="fromData">
          <h2>From Date</h2>
          <DatePicker className="datePicker" selected={fromDate} onChange={(date) => setFromDate(date)} />
        </div>

        <div className="toDate">
          <h2>To Date </h2>
          <DatePicker className="datePicker" selected={toDate} onChange={(date) => setToDate(date)} />
        </div>
      </div>
      <div className="file-upload">
        <h2>Click box to upload</h2>
        <img src={upload} alt="upload" />
        <input
          type="file"
          id="excelFileInput"
          accept=".xlsx, .xls" // Specify accepted file types (Excel formats)
          multiple // Allow multiple file selection
          onChange={handleFileSelect}
        />
      </div>


      {excelData.length > 1 && showExportButton && <button
        className="exportButton"
        onClick={handleExportExcel}
        title="Export"
      >
        Export
      </button>
      }
      {showExportButton && excelData.length <= 1 &&
        <h2>
          No Data found
        </h2>
      }
      {completedFiles &&
        <div className="progressView">
          <h3>
            {`Total files processed ${completedFiles}/${totalFiles}`}
          </h3>
          <h1>
            {progress}
          </h1>
        </div>}
    </div>
  )
}

export default App