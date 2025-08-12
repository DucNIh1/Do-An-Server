const filterData = (rawData) => {
  const data = Object.fromEntries(
    Object.entries(rawData).filter(([_, v]) => v !== null && v !== undefined)
  );
  return data;
};

export default filterData;
