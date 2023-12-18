import { useState } from "react";
import "./App.css";
import * as XLSX from "xlsx";

type readyFunData = {
  일자: any;
  투자자명: any;
  담당자명: any;
  담당자연락처: any;
  투자상품: any;
  계약번호: any;
  투자금액: any;
  수익금: any;
  실지급액: any;
  연락처: any;
  계좌정보: any;
  납입회차?: any;
  납입일?: any;
  만기일: any;
};
type readyFunDataList = Array<readyFunData>;
function valid(list: readyFunData) {
  if (!list["일자"]) return "일자";
  if (!list["투자자명"]) return "투자자명";
  if (!list["담당자명"]) return "담당자명";
  if (!list["담당자연락처"]) return "담당자연락처";
  if (!list["투자상품"]) return "투자상품";
  if (!list["계약번호"]) return "계약번호";
  if (!list["투자금액"]) return "투자금액";
  if (!list["수익금"]) return "수익금";
  if (!list["실지급액"]) return "실지급액";
  if (!list["연락처"]) return "연락처";
  if (!list["계좌정보"]) return "계좌정보";
  // if (!list["납입회차"]) return "납입회차";
  // if (!list["납입일"]) return "납입일";
  if (!list["만기일"]) return "만기일";
  return "";
}
function excelSerialDateToJSDate(excelSerialDate: any) {
  // "Excel serial date" is just
  // the count of days since `01/01/1900`
  // (seems that it may be even fractional).
  //
  // The count of days elapsed
  // since `01/01/1900` (Excel epoch)
  // till `01/01/1970` (Unix epoch).
  // Accounts for leap years
  // (19 of them, yielding 19 extra days).
  const daysBeforeUnixEpoch = 70 * 365 + 19;

  // An hour, approximately, because a minute
  // may be longer than 60 seconds, see "leap seconds".
  const hour = 60 * 60 * 1000;

  // "In the 1900 system, the serial number 1 represents January 1, 1900, 12:00:00 a.m.
  //  while the number 0 represents the fictitious date January 0, 1900".
  // These extra 12 hours are a hack to make things
  // a little bit less weird when rendering parsed dates.
  // E.g. if a date `Jan 1st, 2017` gets parsed as
  // `Jan 1st, 2017, 00:00 UTC` then when displayed in the US
  // it would show up as `Dec 31st, 2016, 19:00 UTC-05` (Austin, Texas).
  // That would be weird for a website user.
  // Therefore this extra 12-hour padding is added
  // to compensate for the most weird cases like this
  // (doesn't solve all of them, but most of them).
  // And if you ask what about -12/+12 border then
  // the answer is people there are already accustomed
  // to the weird time behaviour when their neighbours
  // may have completely different date than they do.
  //
  // `Math.round()` rounds all time fractions
  // smaller than a millisecond (e.g. nanoseconds)
  // but it's unlikely that an Excel serial date
  // is gonna contain even seconds.
  //
  return new Date(
    Math.round((excelSerialDate - daysBeforeUnixEpoch) * 24 * hour) + 12 * hour
  );
}

function App() {
  const [list, setList] = useState<Array<any>>();
  const [searchedList, setSearchedList] = useState<Array<any>>();

  const readUploadFile = (event: any) => {
    if (event.target) event.preventDefault();
    let file;
    if (event.target) file = event.target.files[0];
    else file = event[0];

    setList([]);
    setSearchedList([]);
    const nameElement = document.getElementById("name")! as HTMLInputElement;
    const dateElement = document.getElementById("date")! as HTMLInputElement;
    const textElement = document.getElementById("text")! as HTMLTextAreaElement;
    nameElement.value = "";
    dateElement.value = "";
    textElement.value = "";

    const extension = file.name.split(".").pop();

    if (extension === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, {
            type: "binary",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
          });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const txt = XLSX.utils
            .sheet_to_txt(worksheet)
            .replaceAll('"<', "<")
            .replaceAll('>"', ">")
            .replaceAll('""', '"');
          const tempDiv = document.createElement("div") as HTMLDivElement;
          tempDiv.innerHTML = txt;
          const tempTable = tempDiv.querySelector("table");
          const sheet = XLSX.utils.table_to_sheet(tempTable);
          const json: readyFunDataList = XLSX.utils.sheet_to_json(sheet);

          // 파일 확인
          const notValid = valid(json[0]);
          if (notValid !== "") {
            alert(`"${notValid}" 열이 없는 잘못된 파일입니다.`);
            setList([]);
            if (event.target) event.target.value = "";
            const excelFileText = document.getElementById(
              "excelFileText"
            )! as HTMLInputElement;
            excelFileText.value = "";
            return;
          }

          // 일자 Date type으로 수정 & 금액 Number type으로 수정
          const typedList = json.map((item) => {
            item["만기일"] = excelSerialDateToJSDate(item["만기일"]);
            if ((typeof item['일자']) === 'string') {
              item["일자"] = new Date(
                Number(new Date().getFullYear().toString().substring(0, 2)) +
                item["일자"].split("/")[0],
                item["일자"].split("/")[1] - 1,
                item["일자"].split("/")[2]
              );
            } else {
              item["일자"] = excelSerialDateToJSDate(item["일자"]);
            }
            item["수익금"] = Number(
              item["수익금"].replaceAll(",", "").split("원")[0]
            );
            item["실지급액"] = Number(
              item["실지급액"].replaceAll(",", "").split("원")[0]
            );
            item["투자금액"] = Number(
              item["투자금액"].replaceAll(",", "").split("원")[0]
            );
            return item;
          });
          if (json[0]['납입회차']) {
            // 계약번호 중복 제거
            const idList = [...new Set(typedList?.map((item) => item["계약번호"]))];
            // 각 계약번호 별 최신 일자 데이터 추출
            const filteredList = idList.map((id) => {
              const sortedList = typedList
                .filter((item) => item["계약번호"] === id)
                .sort((a, b) => b["일자"].getTime() - a["일자"].getTime());

              let temp = sortedList[0];

              Array(sortedList.length - 1)
                .fill(null)
                .map((val: readyFunData, idx: number) => {
                  if (idx !== sortedList.length)
                    temp["수익금"] = temp["수익금"] + sortedList[idx + 1]["수익금"];
                  if (idx !== sortedList.length)
                    temp["실지급액"] =
                      temp["실지급액"] + sortedList[idx + 1]["실지급액"];
                  if (idx !== sortedList.length)
                    temp["투자금액"] =
                      temp["투자금액"] + sortedList[idx + 1]["투자금액"];
                  return "";
                });

              return temp;
            });
            const formattedList = filteredList.map<any>((list) => {
              list["일자"] = list["일자"].toISOString().split("T")[0];
              list["만기일"] = list["만기일"].toISOString().split("T")[0];
              list["수익금"] = list["수익금"].toLocaleString();
              list["실지급액"] = list["실지급액"].toLocaleString();
              list["투자금액"] = list["투자금액"].toLocaleString();
              return list;
            });
            setList(formattedList);
          } else {
            const formattedList = typedList.map<any>((list) => {
              list["일자"] = list["일자"].toISOString().split("T")[0];
              list["만기일"] = list["만기일"].toISOString().split("T")[0];
              list["수익금"] = list["수익금"].toLocaleString();
              list["실지급액"] = list["실지급액"].toLocaleString();
              list["투자금액"] = list["투자금액"].toLocaleString();
              return list;
            });
            setList(formattedList);
          }
        } catch (error: any) {
          if (error.toString().includes('File is password-protected')) {
            alert('암호화된 파일입니다.');
            setList([]);
            if (event.target) event.target.value = "";
            const excelFileText = document.getElementById(
              "excelFileText"
            )! as HTMLInputElement;
            excelFileText.value = "";
            return;
          } else {
            alert('알 수 없는 에러입니다.');
            setList([]);
            if (event.target) event.target.value = "";
            const excelFileText = document.getElementById(
              "excelFileText"
            )! as HTMLInputElement;
            excelFileText.value = "";
            return;
          }
        }
      }
      reader.readAsText(file);

      const excelText = document.getElementById(
        "excelFileText"
      )! as HTMLInputElement;
      excelText.value = file.name;
      if (event.target) event.target.value = "";
    } else if (extension === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, {
            type: "array",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
          });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const json: readyFunDataList = XLSX.utils.sheet_to_json(worksheet);

          // 파일 확인
          const notValid = valid(json[0]);
          if (notValid !== "") {
            alert(`"${notValid}" 열이 없는 잘못된 파일입니다.`);
            setList([]);
            if (event.target) event.target.value = "";
            const excelFileText = document.getElementById(
              "excelFileText"
            )! as HTMLInputElement;
            excelFileText.value = "";
            return;
          }

          // 일자 Date type으로 수정 & 금액 Number type으로 수정
          const typedList = json.map((item) => {
            const date1 = new Date(item["일자"]);
            const date2 = new Date(item["만기일"]);
            item["일자"] = date1.setDate(new Date(item["일자"]).getDate() + 1);
            item["만기일"] = date2.setDate(
              new Date(item["만기일"]).getDate() + 1
            );
            item["수익금"] = Number(
              item["수익금"].replaceAll(",", "").split("원")[0]
            );
            item["실지급액"] = Number(
              item["실지급액"].replaceAll(",", "").split("원")[0]
            );
            item["투자금액"] = Number(
              item["투자금액"].replaceAll(",", "").split("원")[0]
            );
            return item;
          });
          // 계약번호 중복 제거
          const idList = [
            ...new Set(typedList?.map((item) => item["계약번호"])),
          ];
          // 각 계약번호 별 최신 일자 데이터 추출
          const filteredList = idList.map((id) => {
            const sortedList = json
              .filter((item) => item["계약번호"] === id)
              .sort((a, b) => b["일자"].getTime() - a["일자"].getTime());

            let temp = sortedList[0];

            Array(sortedList.length - 1)
              .fill(null)
              .map((val: readyFunData, idx: number) => {
                if (idx !== sortedList.length)
                  temp["수익금"] =
                    temp["수익금"] + sortedList[idx + 1]["수익금"];
                if (idx !== sortedList.length)
                  temp["실지급액"] =
                    temp["실지급액"] + sortedList[idx + 1]["실지급액"];
                if (idx !== sortedList.length)
                  temp["투자금액"] =
                    temp["투자금액"] + sortedList[idx + 1]["투자금액"];
                return "";
              });

            return temp;
          });
          const formattedList = filteredList.map<any>((list) => {
            list["일자"] = list["일자"].toISOString().split("T")[0];
            list["만기일"] = list["만기일"].toISOString().split("T")[0];
            list["수익금"] = list["수익금"].toLocaleString();
            list["실지급액"] = list["실지급액"].toLocaleString();
            list["투자금액"] = list["투자금액"].toLocaleString();
            return list;
          });
          setList(formattedList);
        } catch (error: any) {
          if (error.toString().includes('File is password-protected')) {
            alert('암호화된 파일입니다.');
            setList([]);
            if (event.target) event.target.value = "";
            const excelFileText = document.getElementById(
              "excelFileText"
            )! as HTMLInputElement;
            excelFileText.value = "";
            return;
          } else {
            alert('알 수 없는 에러입니다.');
            setList([]);
            if (event.target) event.target.value = "";
            const excelFileText = document.getElementById(
              "excelFileText"
            )! as HTMLInputElement;
            excelFileText.value = "";
            return;
          }
        }
      };

      reader.readAsArrayBuffer(file);

      const excelText = document.getElementById(
        "excelFileText"
      )! as HTMLInputElement;
      excelText.value = file.name;
      if (event.target) event.target.value = "";
    } else {
      alert("해당 종류의 파일은 업로드할 수 없습니다.");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const textElement = document.getElementById("text")! as HTMLTextAreaElement;
    textElement.value = "";
    const formData = new FormData(document.forms[0]);

    const nameFilteredList = list?.filter((item) =>
      item["투자자명"].toString().includes(formData.get("name"))
    );
    const dateFilteredList = list?.filter(
      (item) => item["만기일"] === formData.get("date")
    );
    const allFilteredList = nameFilteredList?.filter(
      (item) => item["만기일"] === formData.get("date")
    );

    if (formData.get("name") && formData.get("date")) {
      setSearchedList(allFilteredList);

      if (allFilteredList && allFilteredList.length === 0) {
        const x = document.getElementById("snackbar")!;
        x.textContent = "검색 결과가 없습니다.";
        x.className = "show";
        setTimeout(function () {
          x.className = x.className.replace("show", "");
        }, 1000);
      }
    } else {
      if (formData.get("date")) {
        setSearchedList(dateFilteredList);
        if (dateFilteredList && dateFilteredList.length === 0) {
          const x = document.getElementById("snackbar")!;
          x.textContent = "검색 결과가 없습니다.";
          x.className = "show2";
          setTimeout(function () {
            x.className = x.className.replace("show2", "");
          }, 1000);
        }
      } else {
        setSearchedList(nameFilteredList);
        if (nameFilteredList && nameFilteredList.length === 0) {
          const x = document.getElementById("snackbar")!;
          x.textContent = "검색 결과가 없습니다.";
          x.className = "show2";
          setTimeout(function () {
            x.className = x.className.replace("show2", "");
          }, 1000);
        }
      }
    }
  };

  const handleSelect = (e: any) => {
    if (e.target.value !== "") {
      const selected = searchedList?.filter(
        (val) => val["계약번호"] === e.target.value
      )[0];
      const msg = selected["납입회차"] ? `${selected["투자자명"]}님 안녕하세요.
레디펀 운영현황 알려드립니다.
현재 (${new Date().getMonth() + 1}월 ${new Date().getDate()}일 기준)

- 가입상품: ${selected["투자상품"]}
- 만기일: ${selected["만기일"].split("-")[0] +
        "년 " +
        selected["만기일"].split("-")[1] +
        "월 " +
        selected["만기일"].split("-")[2] +
        "일"
        }
- 총 투자금액: ${selected["투자금액"]} 원
- 납입회차: ${selected["납입회차"].replace("회차", " 회차")}
- 수익금: ${selected["수익금"]} 원
- 실지급액: ${selected["실지급액"]} 원`
        :
        `${selected["투자자명"]}님 안녕하세요.
레디펀 운영현황 알려드립니다.
현재 (${new Date().getMonth() + 1}월 ${new Date().getDate()}일 기준)

- 가입상품: ${selected["투자상품"]}
- 만기일: ${selected["만기일"].split("-")[0] +
        "년 " +
        selected["만기일"].split("-")[1] +
        "월 " +
        selected["만기일"].split("-")[2] +
        "일"
        }
- 투자금액: ${selected["투자금액"]} 원
- 수익금: ${selected["수익금"]} 원
- 실지급액: ${selected["실지급액"]} 원`;
      const addText = document.getElementById(
        "addText"
      )! as HTMLTextAreaElement;
      const text = document.getElementById("text")! as HTMLTextAreaElement;
      text.value = addText.value ? msg + "\n\n" + addText.value : msg;
    } else {
      const textElement = document.getElementById(
        "text"
      )! as HTMLTextAreaElement;
      textElement.value = "";
    }
  };

  const handleCopy = (e: any) => {
    const text = document.getElementById("text")! as HTMLTextAreaElement;
    window.navigator.clipboard.writeText(text.value);

    const x = document.getElementById("snackbar")!;
    x.textContent = "복사되었습니다.";
    x.className = "show";
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 1000);
  };

  const handleDragover = (e: any) => {
    e.preventDefault();
    const dropZone = document.getElementById("top")!;
    dropZone.classList.add("highlight");
  };
  const handleDragleave = (e: any) => {
    e.preventDefault();
    const dropZone = document.getElementById("top")!;
    dropZone.classList.remove("highlight");
  };
  const handleDrop = (e: any) => {
    e.preventDefault();
    const dropZone = document.getElementById("top")!;
    const fileInput = document.getElementById("excelFile")! as HTMLInputElement;
    dropZone.classList.remove("highlight");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      readUploadFile(files);
    }
  };

  return (
    <div className="App">
      <div id="wrap">
        <button type="button" id="copyBtn" onClick={handleCopy}>
          복사
        </button>
        <div id="snackbar">복사되었습니다.</div>
        <form method="post" onSubmit={handleSubmit}>
          <div
            id="top"
            onDragOver={handleDragover}
            onDragLeave={handleDragleave}
            onDrop={handleDrop}
          >
            <div className="inputWrap">
              <label htmlFor="excelFile">
                {list?.length
                  ? `총 계약 수 : ${list?.length} 건`
                  : "사용할 엑셀파일을 찾아주세요."}
              </label>
              <p>
                <input
                  type="text"
                  name="excelFileText"
                  id="excelFileText"
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("excelFile")?.click()}
                >
                  파일 찾기
                </button>
              </p>
              <input
                hidden
                type="file"
                name="excelFile"
                id="excelFile"
                onChange={readUploadFile}
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              />
            </div>
          </div>
          <div id="middle">
            <div id="left">
              <div className="inputWrap">
                <label htmlFor="name">투자자명</label>
                <input type="text" name="name" id="name" />
              </div>
              <div className="inputWrap">
                <label htmlFor="date">만기일</label>
                <input type="date" name="date" id="date" />
              </div>
              <div className="inputWrap">
                <label htmlFor="results">계약 수: {searchedList?.length}</label>
                <select
                  name="results"
                  id="results"
                  size={4}
                  onChange={handleSelect}
                >
                  <option value="">선택</option>
                  {searchedList &&
                    searchedList.length > 0 &&
                    searchedList?.map((item) => {
                      return (
                        <option key={item["계약번호"]} value={item["계약번호"]}>
                          {item["계약번호"]}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="inputWrap">
                <label htmlFor="addText">비고</label>
                <textarea name="addText" id="addText" rows={8}></textarea>
              </div>
            </div>
            <div id="right">
              <div className="inputWrap" style={{ marginBottom: 0 }}>
                <label htmlFor="text">결과</label>
                <textarea
                  name="text"
                  id="text"
                  style={{ height: "61vh" }}
                ></textarea>
              </div>
            </div>
          </div>
          <div id="bottom">
            <div className="inputWrap">
              <button type="submit">검색</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
