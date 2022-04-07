import { useState } from "react";
import { SketchPicker } from "react-color";

const GradientBox = ({ color, offset, index, updateGradientRangeColor }) => {
  const [r, g, b] = color;

  const pickerColor = { r, g, b };

  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handleChangeComplete = (newColor, event) => {
    const { r, g, b } = newColor.rgb;
    const newColorArr = [r, g, b];
    updateGradientRangeColor(newColorArr, index);
  };

  const hidePicker = () => {
    setIsPickerVisible(false);
  };
  const displayPicker = () => {
    setIsPickerVisible(true);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "relative",
        }}
      >
        <div
          style={{
            backgroundColor: `rgba(${r}, ${g}, ${b}, 1)`,
            width: "60px",
            height: "18px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => displayPicker()}
        ></div>
        <p style={{ textAlign: "center" }}>
          {((offset / 1.0) * 2.0 - 1.0).toFixed(2)}
        </p>
        <div
          style={{
            position: "absolute",
            bottom: "120%",
            zIndex: "2",
            display: `${isPickerVisible ? "block" : "none"}`,
          }}
        >
          <div
            style={{
              position: "fixed",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
            }}
            onClick={() => hidePicker()}
          />
          <SketchPicker
            color={pickerColor}
            onChangeComplete={handleChangeComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default GradientBox;
