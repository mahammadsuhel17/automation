import React, { useState } from "react";
import './App.css'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx'
import moment from "moment/moment";
import upload from './Assets/upload.png'
import { Progress } from "./components/ProgressBar/Progress";

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
    // setting selected file length
    setTotalFiles(files.length)
    // checking if seleted files exist or the selected file length should be greater then 0
    if (files && files.length > 0) {
      // setting export button false becouse after completion of process only the button should show
      setShowExportButton(false)
      // taking empaty arry to push the converted files
      const convertedDataArray = [];
      // looping the selcted files
      for (let i = 0; i <= files.length; i++) {
        // setting the progress value by calculating with file length and index
        setProgress(`${((i / files.length) * 100).toFixed()}`)
        // setting completed files
        setcompletedFiles(i)

        const file = files[i];
        try {
          const data = await readFileAsync(file);
          const workbook = XLSX.read(data, { type: 'binary' });
          // Assuming you want to convert the first sheet to JSON
          const sheetName = workbook.SheetNames;
          // looping the sheets in the single sheet so that we can get only TOTAL sheet data
          await sheetName.forEach(async (sheetName) => {
            if (sheetName === "TOTAL") {
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
                    console.log("itemJavaScriptDate", moment(new Date(val?.Date)).format("DD-MMM"));
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

              // nremoving the undetined data from data1 array
              const newData = await data1.filter((item) => {
                if (item !== undefined) {
                  return item
                }
              })
              // pushing the converd data to data1 array
              convertedDataArray.push(data1);
            }
          })
        } catch (error) {
          console.error(`Error converting Excel file ${file?.name} to JSON:`, error);
        }
      }
      // Set the array of converted JSON data in state
      setExcelData([].concat(...convertedDataArray));
      setShowExportButton(true)
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

  // converting json to excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "DataSheet.xlsx", { type: 'binary', bookType: 'xlsx', cellDates: true });
  }

  return (
    <div className="mainContainer">
      <div className='container'>
        <div className='datePickerView'>
          <div className="fromData">
            <h3>From Date</h3>
            <DatePicker className="datePicker" selected={fromDate} onChange={(date) => setFromDate(date)} />
          </div>

          <div className="toDate">
            <h3>To Date </h3>
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
          <h3>
            No Data found
          </h3>
        }
        {completedFiles &&
          <div className="progressView">
            <h3>
              {`Total files processed ${completedFiles}/${totalFiles}`}
            </h3>
            <Progress
              progress={progress}
            />
          </div>}
      </div>
    </div>
  )
}

export default App