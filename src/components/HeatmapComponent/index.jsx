// heatmap state data
import heatmapData from "../../data/points.json";

import React, { useEffect, useRef, useState } from "react";
// visualHeatmap.esm.browser
// import Heatmap from "../../heatmap_lib/dist/visualHeatmap.esm.browser";
import Heatmap from "../../heatmap_lib/main.js";
import * as d3 from "d3";
import { timeFormat } from "d3-time-format";
import * as d3_array from "d3-array";

import GradientBox from "../GradientBox";
import DistanceRangeSlider from "../DistanceRangeSlider";
import { Button } from "antd";
import YScale from "../YScale";

function generateNewPointsData() {
  const SLICES_COUNT = 30;
  const DISTANCE_POINTS_COUNT = 20;
  const DISTANCE_STEP = 150;
  // const localeTimeFormatter = timeFormat("%X");
  function getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  const points = [];

  let x = 1500;

  for (let i = 0; i < SLICES_COUNT; i++) {
    for (let j = 0; j < DISTANCE_POINTS_COUNT; j++) {
      const isArray = Array.isArray(points[i]);
      if (!isArray) {
        points[i] = [];
      }
      const point = {};
      point.x = x + DISTANCE_STEP * j;
      point.y = new Date(Date.now() + 5000 * i);
      point.value = getRandomInt(50, 250);
      points[i].push(point);
    }
  }
  return points;
}

// ----- D3 SCALE SETUP -----
// Setup scale scaffold, draw x and y axis scales based on data
const SCALE_WIDTH = 1100;
const SCALE_HEIGHT = 550;
// --
const HEATMAP_WIDTH = SCALE_WIDTH - 100;
const HEATMAP_HEIGHT = SCALE_HEIGHT;

let maxValue = 0;
// add sizes to heatmap points
// to create option to calculate vertex positions
let minDistanceValue;
let maxDistanceValue;
let distancePointsArray;

const MIN_ALLOWED_POINT_VALUE = -4.1;
const MAX_ALLOWED_POINT_VALUE = 4.06;

const heatmapPoints = heatmapData[1].points.map((pointArray, pointArrayIdx) => {
  const distancePoints = pointArray.map((point) => point.x);
  // -- distance data for range slider.
  const [minDistance, maxDistance] = d3.extent(distancePoints);
  if (pointArrayIdx === 0) {
    minDistanceValue = minDistance;
    maxDistanceValue = maxDistance;
    distancePointsArray = distancePoints;
  }

  return pointArray.map((point, idx, array) => {
    if (maxValue < point.value) {
      maxValue = point.value;
    }
    const yPixelSize = HEATMAP_HEIGHT / pointArray.length;

    const getYBottomCoord = (index) =>
      ((yPixelSize * index) / HEATMAP_HEIGHT) * 2.0 - 1.0;

    let yDiff;
    if (pointArrayIdx === 0) {
      yDiff =
        getYBottomCoord(pointArrayIdx + 1) - getYBottomCoord(pointArrayIdx);
    } else {
      const previousClipSpaceY = getYBottomCoord(pointArrayIdx - 1);
      yDiff = getYBottomCoord(pointArrayIdx) - previousClipSpaceY;
    }

    const nextPoint = array[idx + 1];
    const gradientOffsetCurrent = forceNumIntoRange(
      point.value,
      [MIN_ALLOWED_POINT_VALUE, MAX_ALLOWED_POINT_VALUE],
      [0, 1]
    );
    const gradientOffsetNext = forceNumIntoRange(
      point.value,
      [MIN_ALLOWED_POINT_VALUE, MAX_ALLOWED_POINT_VALUE],
      [0, 1]
    );

    let rightOffsetX = nextPoint
      ? clip(nextPoint.x, maxDistance, minDistance) -
        clip(point.x, maxDistance, minDistance)
      : 0;

    let bottomOffsetY = yDiff;

    return {
      ...point,
      rightOffsetX,
      bottomOffsetY,
      clipYBottomCoord: getYBottomCoord(pointArrayIdx),
      gradientOffset: {
        current: gradientOffsetCurrent > 1 ? 1 : gradientOffsetCurrent,
        next: gradientOffsetNext > 1 ? 1 : gradientOffsetNext,
      },
    };
  });
  // .slice(0, -1);
});
// console.log("points");
// console.log(heatmapPoints);

function forceNumIntoRange(num, oldRange, newRange) {
  const [newMin, newMax] = newRange;
  const [oldMin, oldMax] = oldRange;
  const result =
    ((num - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
  return result;
}

/**
 *
 * @param { number } num - number to force into webgl clipspace
 * @param { number } max  - max value in array
 * @returns clip space coordinate corresponding number
 */
function clip(num, max, min) {
  // let clipSpaceCoord = (num / max) * 2.0 - 1.0;
  const clipMin = -1;
  const clipMax = 1;
  let clipSpaceCoord =
    ((num - min) * (clipMax - clipMin)) / (max - min) + clipMin;

  // if (clipSpaceCoord > 0.99) {
  //   clipSpaceCoord = 0.99;
  // }
  // if (clipSpaceCoord < -0.99) {
  //   clipSpaceCoord = -0.99;
  // }
  return clipSpaceCoord;
}

function toClipSpace(array) {
  const [min, max] = d3_array.extent(array);
  const clipSpacedValues = array.map((value) => {
    return clip(value, max, min);
  });

  return clipSpacedValues;
}

/**
 * @param { number } idx - index of data slice in array of arrays with points objects
 */
function getHeatmapDataSliceByIndex(index) {
  const currentTimeSlice = heatmapPoints[index];
  // if (idx > heatmapPoints.length - 1) {
  // counterRef.current = 1;
  // localIndex = 0;
  // }
  // data for d3 scale drawing
  const xValues = currentTimeSlice.map((point) => point.x);
  const yValues = currentTimeSlice.map((point) => Date.parse(point.y));

  // data interpolated to pixel values of container element
  // rectangle sizes in range -1 to 1
  const offsetValuesAndClipSpaceY = currentTimeSlice.map((point) => {
    const { clipYBottomCoord } = point;
    return {
      x: point.rightOffsetX,
      y: point.bottomOffsetY,
      clipYBottomCoord,
    };
  });

  const clipSpacedXValues = toClipSpace(xValues);

  const heatmapData = currentTimeSlice.map((point, idx) => {
    const { value, gradientOffset } = point;
    const { current, next } = gradientOffset;

    return {
      scaleData: {
        x: xValues[idx],
        y: yValues[idx],
      },
      clipSpaceCoords: {
        x: clipSpacedXValues[idx],
        y: offsetValuesAndClipSpaceY[idx].clipYBottomCoord,
      },
      gradientOffset: {
        current,
        next,
      },
      value,
      sizeValues: {
        rightOffsetX: offsetValuesAndClipSpaceY[idx].x,
        bottomOffsetY: offsetValuesAndClipSpaceY[idx].y,
      },
    };
  });
  // logging condition
  if (index === 0 || index === 1) {
    // console.log("index log ", idx);
    // console.log("returned data");
    // console.log(heatmapData);
  }
  return heatmapData;
}

// scales setup

const HeatmapComponent = () => {
  const mapRef = useRef(null);
  const intervalRef = useRef(null);
  const counterRef = useRef(0);

  const HORIZONTAL_HEATMAP = "horizontal";
  // const CIRCLE_HEATMAP = "circle";

  const [gradientRange, setGradientRange] = useState([
    {
      color: [0, 0, 255, 1.0],
      offset: 0.0,
    },
    {
      color: [0, 100, 255, 1.0],
      offset: 0.16,
    },
    {
      color: [0, 150, 255, 1.0],
      offset: 0.33,
    },
    {
      color: [0, 200, 255, 1.0],
      offset: 0.44,
    },
    {
      color: [0, 0, 0, 1.0],
      offset: 0.5,
    },
    {
      color: [255, 255, 0, 1.0],
      offset: 0.66,
    },
    {
      color: [255, 210, 0, 1.0],
      offset: 0.77,
    },
    {
      color: [255, 140, 0, 1.0],
      offset: 0.88,
    },
    {
      color: [255, 0, 0, 1.0],
      offset: 1.0,
    },
  ]);

  function updateGradientRangeColor(rgbArr, idx) {
    const newRange = gradientRange.map((colorObj, index) => {
      if (index === idx) {
        return {
          ...colorObj,
          color: rgbArr,
        };
      } else {
        return colorObj;
      }
    });
    setGradientRange(newRange);
  }
  const heatmapInstanceRef = useRef(null);
  const [currentData, setCurrentData] = useState([]);
  const updateCanvas = () => {
    if (heatmapInstanceRef.current) {
      const instance = heatmapInstanceRef.current;
      const dataSlice = getHeatmapDataSliceByIndex(counterRef.current);
      if (counterRef.current < heatmapPoints[0].length) {
        if (counterRef.current === 0) {
          setCurrentData([...dataSlice]);
          instance.renderData(dataSlice);
        } else {
          setCurrentData((prevState) => [...prevState, ...dataSlice]);
          instance.addData(dataSlice, true);
        }
        counterRef.current += 1;
      } else if (
        counterRef.current === heatmapPoints[0].length - 1 ||
        counterRef.current > heatmapPoints[0].length - 1
      ) {
        counterRef.current = 0;
        instance.clear();
      }
    }
  };

  const [yScaleTicks, setYScaleTicks] = useState([]);
  const updateYScale = () => {
    if (counterRef.current < heatmapPoints[0].length) {
      setYScaleTicks((prevState) => [
        ...prevState,
        heatmapPoints[counterRef.current][0].y,
      ]);
    } else if (
      counterRef.current === heatmapPoints[0].length ||
      counterRef.current > heatmapPoints[0].length
    ) {
      // console.log("counter is === or > length, wiping values");
      setYScaleTicks([]);
    }
  };

  const [minDistance, setMinDistance] = useState(minDistanceValue);
  const [maxDistance, setMaxDistance] = useState(maxDistanceValue);

  const redrawCanvas = () => {
    if (heatmapInstanceRef.current) {
      const instance = heatmapInstanceRef.current;
      console.log("redraw canvas log");
      console.log("current data");
      console.log(currentData);
      instance.clear();
      // instance.renderData(currentData);
    }
  };

  function startDraw() {
    intervalRef.current = setInterval(() => {
      updateYScale();
      updateCanvas();
    }, 2000);
  }
  function stopDraw() {
    clearInterval(intervalRef.current);
  }
  // setup heatmap
  useEffect(() => {
    mapRef.current.innerHTML = "";
    heatmapInstanceRef.current = new Heatmap(`#${mapRef.current.id}`, {
      // 'horizontal' or 'circles'
      // type: HORIZONTAL_HEATMAP,
      type: HORIZONTAL_HEATMAP,
      size: 25.0,
      max: maxValue,
      blur: 1.0,
      // offset should be around 0.11 per element. 9 elements in total
      // mid has to be black.
      gradient: gradientRange,
    });

    // 2s interval to fill chart with next time slice
    return () => {
      // console.log("component unmounting, timer destroyed");
      // clearInterval(intervalRef.current);
    };
  }, [gradientRange]);

  // draw x scale
  useEffect(() => {
    var svg = d3
      .select("#d3_scale")
      .html("")
      .append("svg")
      .attr("width", SCALE_WIDTH)
      .attr("height", SCALE_HEIGHT + 50);
    const xScaleData = heatmapPoints[counterRef.current].map(
      (point) => point.x
    );

    var xAxisTranslate = Number(SCALE_HEIGHT) + 10;
    var xscale = d3
      .scaleLinear()
      .domain([d3.min(xScaleData), d3.max(xScaleData)])
      .range([0, SCALE_WIDTH - 100]);

    var x_axis = d3.axisBottom().scale(xscale);

    svg
      .append("g")
      .style("transform", `translate(50px, ${xAxisTranslate}px)`)
      // .attr("transform", ``)
      .call(x_axis);
  }, []);

  const [distanceSliderValues, setDistanceSliderValues] =
    useState(distancePointsArray);

  return (
    <div>
      <div style={{ marginLeft: "5.35rem" }}>
        <h2 style={{ fontWeight: "normal" }}>Давление в трубе</h2>
        <Button
          type="primary"
          style={{ marginRight: "1rem" }}
          onClick={() => startDraw()}
        >
          Старт
        </Button>
        <Button type="primary" danger onClick={() => stopDraw()}>
          Стоп
        </Button>
      </div>

      <div style={{ position: "relative", width: SCALE_WIDTH, height: 600 }}>
        <YScale
          scaleHeight={SCALE_HEIGHT}
          numberOfSlices={heatmapPoints[0].length}
          yScaleTicks={yScaleTicks}
        />
        <div
          id="visual-heatmap-container"
          ref={mapRef}
          style={{
            width: `${HEATMAP_WIDTH}px`,
            height: `${HEATMAP_HEIGHT}px`,
            position: "absolute",
            top: "10px",
            backgroundColor: "lightgrey",
            left: "86px",
            zIndex: 1,
          }}
        ></div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <DistanceRangeSlider
          width={HEATMAP_WIDTH}
          values={distanceSliderValues}
          setValues={setDistanceSliderValues}
          maxDist={maxDistance}
          minDist={minDistance}
          setMinDist={setMinDistance}
          setMaxDist={setMaxDistance}
          redraw={redrawCanvas}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 1000,
            // margin: "0 auto",
            marginLeft: "60px",
            paddingTop: "1rem",
            // gap: "25px",
          }}
        >
          {gradientRange.map((gradientItem, idx) => {
            const { color, offset } = gradientItem;
            return (
              <GradientBox
                color={color}
                offset={offset}
                key={`${color}/${idx}`}
                index={idx}
                updateGradientRangeColor={updateGradientRangeColor}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeatmapComponent;
