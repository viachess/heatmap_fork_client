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
  setMinDist,
  setMaxDist,
  redraw,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState([minDist, maxDist]);

  const handleAfterChange = (newValues) => {
    console.log(newValues);
    const newMin = newValues[0];
    const newMax = newValues[1];
    const min = range[0];
    const max = range[1];
    if (newMin !== min || newMax !== max) {
      setIsUpdated(true);
      setRange([newMin, newMax]);
    }
  };

  const [pipeDistanceMarks, setPipeDistanceMarks] = useState();
  useEffect(() => {
    const marks = {};
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
  }, [values]);

  const [isUpdated, setIsUpdated] = useState(false);
  const handleUpdateBtnClick = () => {
    setIsUpdated(false);
    setMinDist(range[0]);
    setMaxDist(range[1]);
    redraw();
  };
  const hideUpdateBtnClick = () => {
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
              <Button
                type="primary"
                onClick={handleUpdateBtnClick}
                style={{ marginRight: "1rem" }}
              >
                Обновить
              </Button>
              <Button danger onClick={hideUpdateBtnClick}>
                Нет
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default DistanceRangeSlider;
