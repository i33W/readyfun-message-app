import { useState } from 'react';
import './App.css';
import * as xlsx from 'xlsx'



function App() {
  const [lists, setLists] = useState<Array<any>>()

  const readUploadFile = (e: any) => {
    e.preventDefault();
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(worksheet);
        setLists(json);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(document.forms[0])

    lists?.map((item) => {
      if (item['투자자명'].toString().includes(formData.get('name'))) {
        console.log(item)
      }
    })
  }

  return (
    <div className="App">
      <div id='wrap'>
        <form method="post" onSubmit={handleSubmit}>
          <div id='top'>
            <div className='inputWrap'>
              <label htmlFor="excelFile">사용할 엑셀파일을 찾아주세요.</label>
              <input type="file" name='excelFile' id='excelFile' onChange={readUploadFile} accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
            </div>
          </div>
          <div id='middle'>
            <div id='left'>
              <div className='inputWrap'>
                <label htmlFor="name">투자자명</label>
                <input type="text" name='name' id='name' />
              </div>
              <div className='inputWrap'>
                <label htmlFor="date">만기일</label>
                <input type="date" name='date' id='date' />
              </div>
              <div className='inputWrap'>
                <label htmlFor="results">선택</label>
                <select name="results" id="results" size={11}>
                  <option value="">select</option>
                </select>
              </div>
            </div>
            <div id='right'>
              <div className='inputWrap'>
                <label htmlFor="text">결과</label>
                <textarea name='text' id='text' rows={20}></textarea>
              </div>
            </div>
          </div>
          <div id='bottom'>
            <div className='inputWrap'>
              <button type='submit'>검색</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
