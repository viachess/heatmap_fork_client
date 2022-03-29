// heatmap state data
import heatmapData from "../../data/points.json";

import React, { useEffect, useRef, useState } from "react";
// visualHeatmap.esm.browser
import Heatmap from "../../heatmap_lib/dist/visualHeatmap.esm.browser";
import * as d3 from "d3";
import { timeFormat } from "d3-time-format";
import * as d3_array from "d3-array";

// function getRandomInt(min, max) {
//   return min + Math.floor(Math.random() * (max - min + 1));
// }
// const localeTimeFormatter = timeFormat("%X");

const heatmap_width = 700;
const heatmap_height = 490;

const heatmapPoints = heatmapData[0].points;

function interpolateArray(array, type, count) {
  const [oldMin, oldMax] = d3_array.extent(array);

  const webglMin = -1;
  const webglMax = 1;
  const oldRange = oldMax - oldMin;
  const newRange = webglMax - webglMin;

  const interpolated = array.map((oldValue, index, array) => {
    const newValue = ((oldValue - oldMin) * newRange) / (oldRange + webglMin);
    let multiplier = type === "x" ? heatmap_width : heatmap_height;

    let multiplied = newValue * multiplier;
    if (type !== "x") {
      if (count > 0) {
        // 320 / length
        multiplied =
          newValue * multiplier + (550 - (550 / array.length) * count);
      } else {
        multiplied = newValue * multiplier + 550;
      }
    }
    return multiplied;
  });

  const floatArr = new Float32Array(interpolated);

  return interpolated;
}

// const points = [];

// let x = 1500;

// for (let i = 0; i < 30; i++) {
//   for (let j = 0; j < 30; j++) {
//     const isArray = Array.isArray(points[i]);
//     if (!isArray) {
//       points[i] = [];
//     }
//     const point = {};
//     point.x = x + 50 * j;
//     point.y = new Date(Date.now() + 5000 * i);
//     point.value = getRandomInt(50, 250);
//     points[i].push(point);
//   }
// }

const HeatmapComponent = () => {
  const mapRef = useRef(null);
  const intervalRef = useRef();
  const counterRef = useRef(0);

  function getHeatmapInstanceData(idx) {
    let localIndex = idx;
    if (idx > heatmapPoints.length - 1) {
      counterRef.current = 0;
      localIndex = 0;
    }

    const yValues = heatmapPoints[localIndex].map((point) =>
      Date.parse(point.y)
    );
    const xValues = heatmapPoints[localIndex].map((point) =>
      Date.parse(point.x)
    );

    const interpolatedXValues = interpolateArray(xValues, "x");
    const interpolatedYValues = interpolateArray(
      yValues,
      "y",
      counterRef.current
    );

    const interpolatedHeatmap = heatmapPoints[localIndex].map((point, idx) => {
      const { value } = point;
      return {
        x: interpolatedXValues[idx],
        y: interpolatedYValues[idx],
        value,
      };
    });

    return interpolatedHeatmap;
  }

  const [yScaleTicks, setYScaleTicks] = useState([]);

  useEffect(() => {
    mapRef.current.innerHTML = "";
    const instance = new Heatmap(`#${mapRef.current.id}`, {
      size: 25.0,
      max: 200,
      blur: 1.0,
      gradient: [
        {
          color: [0, 0, 255, 1.0],
          offset: 0,
        },
        {
          color: [0, 100, 255, 1.0],
          offset: 0.2,
        },
        {
          color: [0, 150, 255, 1.0],
          offset: 0.3,
        },
        {
          color: [0, 200, 255, 1.0],
          offset: 0.4,
        },
        // {
        //   color: [0, 0, 0, 1.0],
        //   offset: 0.5
        // },
        {
          color: [255, 255, 0, 1.0],
          offset: 0.6,
        },
        {
          color: [255, 210, 0, 1.0],
          offset: 0.7,
        },
        {
          color: [255, 140, 0, 1.0],
          offset: 0.85,
        },
        {
          color: [255, 0, 0, 1.0],
          offset: 1.0,
        },
      ],
    });

    const initHeatmap = () => {
      const initialHeatmapData = getHeatmapInstanceData(0);
      setYScaleTicks([heatmapPoints[0][0].y]);
      instance.renderData(initialHeatmapData);
    };
    initHeatmap();

    // intervalRef.current = setInterval(() => {
    //   if (counterRef.current === 0) {
    //     initHeatmap();
    //   }

    //   counterRef.current += 1;
    //   const newHeatmapData = getHeatmapInstanceData(counterRef.current);
    //   setYScaleTicks((prevState) => {
    //     return [...prevState, heatmapPoints[counterRef.current][0].y];
    //   });
    //   instance.addData(newHeatmapData, true);
    // }, 2000);
    return () => {
      // clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const width = 1000;
    const height = 1100;

    var svg = d3
      .select("#d3_scale")
      .html("")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    const xScaleData = heatmapPoints[counterRef.current].map(
      (point) => point.x
    );
    // const yScaleData = heatmapPoints.map((array) => {
    //   return array[0].y;
    // });
    // const height = 980;
    //     let yScale = d3
    //       .scaleTime()
    //       .domain(
    //         d3.extent(yScaleData, function (d) {
    //           return new Date(d);
    //         })
    //       )
    //       .range([height / 2, 0]);

    //     svg
    //       .append("g")
    //       .classed("y_axis", true)
    //       .attr("transform", "translate(50, 10)")
    //       .call(
    //         d3
    //           .axisLeft(yScale)
    //           .tickFormat(d3.timeFormat("%H:%M:%S"))
    //           .tickValues(
    //             yScaleData.map(function (d, idx) {
    //               return new Date(d);
    //             })
    //           )
    //       );

    var xAxisTranslate = height / 2 + 10;
    var xscale = d3
      .scaleLinear()
      .domain([d3.min(xScaleData), d3.max(xScaleData)])
      .range([0, width - 100]);

    var x_axis = d3.axisBottom().scale(xscale);

    svg
      .append("g")
      .attr("transform", "translate(50, " + xAxisTranslate + ")")
      .call(x_axis);
  }, []);

  useEffect(() => {
    const yScaleSVG = d3.select("#d3_scale").select("svg");
    yScaleSVG.selectAll(".y_axis").remove();
    const height = 1100;

    let yScale = d3
      .scaleTime()
      .domain(
        d3.extent(yScaleTicks, function (d) {
          return new Date(d);
        })
      )
      .range([height / 2, 0]);

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
            yScaleTicks.map(function (d, idx) {
              return new Date(d);
            })
          )
      );
    const chartScaleHeight = height / 2;
    const individualTextBlockHeight = chartScaleHeight / heatmapPoints.length;

    yScaleSVG
      .select(".y_axis")
      .selectAll(".tick")
      .select(function (date, index) {
        const yShift = chartScaleHeight - individualTextBlockHeight * index;
        this.style.transform = `translate(0,${yShift}px)`;
      });
  }, [yScaleTicks]);

  return (
    <div>
      <h2>давление в трубе</h2>

      <div style={{ position: "relative", width: 800, height: 1200 }}>
        <div
          id="d3_scale"
          style={{ marginLeft: "2.2rem", position: "absolute" }}
        ></div>
        <div
          id="visual-heatmap-container"
          ref={mapRef}
          style={{
            width: 900,
            height: 550,
            position: "absolute",
            top: "10px",
            backgroundColor: "lightgrey",
            left: "86px",
            zIndex: 10,
          }}
        ></div>
      </div>
    </div>
  );
};

export default HeatmapComponent;
