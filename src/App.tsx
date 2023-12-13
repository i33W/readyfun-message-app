import './App.css';

function App() {
  return (
    <div className="App">
      <div id='wrap'>
        <div id='top'>
          <div className='inputWrap'>
            <label htmlFor="excelFile">사용할 엑셀파일을 찾아주세요.</label>
            <input type="file" name='excelFile' id='excelFile' />
          </div>
        </div>
        <div id='middle'>
          <div id='left'>
            <div className='inputWrap'>
              <label htmlFor="name">입금자명</label>
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
            <button>검색</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
