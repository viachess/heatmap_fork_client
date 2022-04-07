import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

const DistanceRangeSlider = ({ width, values, setValues }) => {
  const valuetext = (value) => {
    return `${value}км.`;
  };
  const handleChange = (event, newValue) => {
    // TODO: Fix, add handler for data altering
    setValues(newValue);
  };

  return (
    <Box sx={{ width }} alignSelf={"center"} marginLeft="60px">
      <Slider
        getAriaLabel={() => "Изменить расстояние"}
        value={values}
        onChange={handleChange}
        valueLabelDisplay="auto"
        getAriaValueText={valuetext}
      />
    </Box>
  );
};

export default DistanceRangeSlider;
