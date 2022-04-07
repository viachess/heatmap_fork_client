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

function generateNewPointsData() {
  function getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  const localeTimeFormatter = timeFormat("%X");
  const points = [];

  let x = 1500;

  for (let i = 0; i < 30; i++) {
    for (let j = 0; j < 30; j++) {
      const isArray = Array.isArray(points[i]);
      if (!isArray) {
        points[i] = [];
      }
      const point = {};
      point.x = x + 50 * j;
      point.y = new Date(Date.now() + 5000 * i);
      point.value = getRandomInt(50, 250);
      points[i].push(point);
    }
  }
  return points;
}

const pipeDistanceMarks = [
  {
    value: 1650,
    label: "1650 km.",
  },
  {
    value: 1700,
    label: "1700 km.",
  },
  {
    value: 1850,
    label: "1850 km.",
  },
  {
    value: 2300,
    label: "2300 km.",
  },
];

// const heatmap_width = 700;
const heatmap_height = 550;

let maxValue = 0;
// add sizes to heatmap points
// to create option to calculate vertex positions
const heatmapPoints = heatmapData[0].points.map((pointArray, pointArrayIdx) => {
  const xValues = pointArray.map((point) => point.x);
  const [min, max] = d3.extent(xValues);
  const yPixelSize = heatmap_height / pointArray.length;
  const getYTopCoord = (index) =>
    ((yPixelSize * index) / heatmap_height) * 2.0 - 1.0;

  // 0 to 30 length
  // yClipTopCoord is ((pixelSize * index) / heatmap_height) * 2.0 - 1.0;
  // const pixelYPointSize = heatmap_height / pointArray.length;
  // ??
  let yDiff;
  if (pointArrayIdx === 0) {
    yDiff = getYTopCoord(pointArrayIdx + 1) - getYTopCoord(pointArrayIdx);
  } else {
    const previousClipSpaceY = getYTopCoord(pointArrayIdx - 1);
    yDiff = getYTopCoord(pointArrayIdx) - previousClipSpaceY;
  }

  return pointArray.map((point, idx, array) => {
    if (maxValue < point.value) {
      maxValue = point.value;
    }

    // point to count difference on, if it is the last element of array,
    // use previous element [index - 1], otherwise count from next [index + 1]
    const diffPoint =
      idx !== array.length - 1 ? array[idx + 1] : array[idx - 1];
    // count distance size in units using values to the right,
    // if element is last, use value to the left
    let sizeX = Math.abs(clip(diffPoint.x, max, min) - clip(point.x, max, min));

    let sizeY = yDiff;
    // const clipYTopCoord =
    return {
      ...point,
      sizeX,
      sizeY,
      clipYTopCoord: getYTopCoord(pointArrayIdx),
    };
  });
});

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

  if (clipSpaceCoord > 0.99) {
    clipSpaceCoord = 0.99;
  }
  if (clipSpaceCoord < -0.99) {
    clipSpaceCoord = -0.99;
  }
  return clipSpaceCoord;
}

function toClipSpace(array) {
  const [min, max] = d3_array.extent(array);
  const clipSpacedValues = array.map((value) => {
    return clip(value, max, min);
  });

  return clipSpacedValues;
}

// scales setup
function drawYScale(scaleTicks, scaleHeight) {
  const yScaleSVG = d3.select("#d3_scale").select("svg");
  yScaleSVG.selectAll(".y_axis").remove();

  let yScale = d3
    .scaleTime()
    .domain(
      d3.extent(scaleTicks, function (d) {
        return new Date(d);
      })
    )
    .range([scaleHeight, 0]);

  yScaleSVG
    .append("g")
    .classed("y_axis", true)
    .html("")
    .attr("transform", "translate(50, 10)")
    .transition()
    .duration(500)
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat(d3.timeFormat("%H:%M:%S"))
        .tickValues(
          scaleTicks.map(function (d, idx) {
            return new Date(d);
          })
        )
    );
  const chartScaleHeight = scaleHeight;
  const individualTextBlockHeight = chartScaleHeight / heatmapPoints.length;

  yScaleSVG
    .select(".y_axis")
    .selectAll(".tick")
    .select(function (date, index) {
      const yShift = chartScaleHeight - individualTextBlockHeight * index;
      this.style.transform = `translate(0,${yShift}px)`;
    });
}

const HeatmapComponent = () => {
  const mapRef = useRef(null);
  const intervalRef = useRef(null);
  const counterRef = useRef(0);

  /**
   * @param { number } idx - index of data slice in array of arrays with points objects
   */
  function getHeatmapData(idx) {
    // console.log("heatmap log, index: ", idx);
    let localIndex = idx;

    // if (idx > heatmapPoints.length - 1) {
    // counterRef.current = 1;
    // localIndex = 0;
    // }
    // data for d3 scale drawing
    const xValues = heatmapPoints[localIndex].map((point) => point.x);
    const yValues = heatmapPoints[localIndex].map((point) =>
      Date.parse(point.y)
    );

    // data interpolated to pixel values of container element
    // rectangle sizes in range -1 to 1
    const sizeValuesAndClipSpaceY = heatmapPoints[localIndex].map((point) => {
      const { clipYTopCoord } = point;
      return {
        x: point.sizeX,
        y: point.sizeY,
        clipYTopCoord,
      };
    });

    const clipSpacedXValues = toClipSpace(xValues);

    const heatmapData = heatmapPoints[localIndex].map((point, idx) => {
      const { value } = point;
      return {
        scaleData: {
          x: xValues[idx],
          y: yValues[idx],
        },
        clipSpaceCoords: {
          x: clipSpacedXValues[idx],
          y: sizeValuesAndClipSpaceY[idx].clipYTopCoord,
        },
        value,
        sizeValues: {
          sizeX: sizeValuesAndClipSpaceY[idx].x,
          sizeY: sizeValuesAndClipSpaceY[idx].y,
        },
      };
    });

    if (idx === 0 || idx === 1) {
      console.log("index log ", idx);
      console.log("returned data");
      console.log(heatmapData);
    }
    return heatmapData;
  }

  const HORIZONTAL_HEATMAP = "horizontal";
  const CIRCLE_HEATMAP = "circle";

  const [yScaleTicks, setYScaleTicks] = useState([]);
  const [gradientRange, setGradientRange] = useState([
    {
      color: [0, 0, 255, 1.0],
      offset: 0.11,
    },
    {
      color: [0, 100, 255, 1.0],
      offset: 0.22,
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
      offset: 0.55,
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

  useEffect(() => {
    mapRef.current.innerHTML = "";
    const instance = new Heatmap(`#${mapRef.current.id}`, {
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

    const initHeatmap = () => {
      const initialHeatmapData = getHeatmapData(0);
      setYScaleTicks([heatmapPoints[0][0].y]);
      instance.renderData(initialHeatmapData);
    };

    intervalRef.current = setInterval(() => {
      if (counterRef.current > 1) {
        clearInterval(intervalRef.current);
        return;
      }
      if (counterRef.current === 0) {
        console.log(`counterRef === 0 if condition ${counterRef.current}`);
        counterRef.current += 1;
        initHeatmap();

        return;
      }
      if (counterRef.current === heatmapPoints.length - 1) {
        counterRef.current = 0;
        instance.clear();
        initHeatmap();
        return;
      }

      const newHeatmapData = getHeatmapData(counterRef.current);
      setYScaleTicks((prevState) => {
        return [...prevState, heatmapPoints[counterRef.current][0].y];
      });
      instance.addData(newHeatmapData, true);
      counterRef.current += 1;
    }, 2000);
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [gradientRange]);
  // ----- D3 SCALE SETUP -----
  // Setup scale scaffold, draw x and y axis scales based on data
  const SCALE_WIDTH = 1100;
  const SCALE_HEIGHT = 550;
  // --
  const HEATMAP_WIDTH = SCALE_WIDTH - 100;
  const HEATMAP_HEIGHT = SCALE_HEIGHT;

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

  useEffect(() => {
    drawYScale(yScaleTicks, SCALE_HEIGHT);
  }, [yScaleTicks]);

  const [distanceSliderValues, setDistanceSliderValues] = React.useState([
    1600, 1900,
  ]);

  return (
    <div>
      <h2 style={{ fontWeight: "normal", marginLeft: "5rem" }}>
        Давление в трубе
      </h2>

      <div style={{ position: "relative", width: SCALE_WIDTH, height: 600 }}>
        <div
          id="d3_scale"
          style={{ marginLeft: "2.2rem", position: "absolute" }}
        ></div>
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
