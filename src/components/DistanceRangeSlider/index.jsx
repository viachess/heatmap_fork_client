// import Slider from "@mui/material/Slider";
import { Slider, Button } from "antd";

import { useEffect, useLayoutEffect, useState } from "react";
import "antd/dist/antd.css";

const DistanceRangeSlider = ({
  width,
  values,
  setValues,
  minDist,
  maxDist,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleAfterChange = (event, newValue) => {
    // TODO: Fix, add handler for data altering
    console.log("range slider change event fired");
    console.log("event");
    console.log(event);
    console.log("value");
    console.log(newValue);
    setIsUpdated(true);
    // setValues(newValue);
  };
  const [pipeDistanceMarks, setPipeDistanceMarks] = useState();
  useEffect(() => {
    const marks = {};
    console.log("pipe distance values");
    values.sort((a, b) => a - b);
    values.forEach((value, index) => {
      if (index % 2 === 0) {
        marks[value] = {
          style: {
            marginTop: "-35px",
          },
          label: <>{value}</>,
        };
      } else {
        marks[value] = `${value}`;
      }
    });

    setPipeDistanceMarks(marks);
    setIsLoading(false);
    // console.log("pipe distance marks");
    // console.log(pipeDistanceMarks);
  }, [values]);

  const [isUpdated, setIsUpdated] = useState(false);
  const handleUpdateBtnClick = () => {
    // TODO: set values using setValues func
    setIsUpdated(false);
  };

  return (
    <>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div
            style={{ width: "1014px", marginLeft: "70px", marginTop: "0px" }}
          >
            <Slider
              range
              marks={pipeDistanceMarks}
              step={null}
              defaultValue={[minDist, maxDist]}
              onAfterChange={handleAfterChange}
              min={minDist}
              max={maxDist}
            />
          </div>
          {isUpdated && (
            <div>
              <h5>Обнаружены изменения в расстоянии, обновить данные?</h5>
              <Button type="primary" onClick={handleUpdateBtnClick}>
                Обновить
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default DistanceRangeSlider;
