// OrderListSlice.js
import {createSlice} from '@reduxjs/toolkit';

initialState = {
  item: null,
};

const orderListSlice = createSlice({
  name: 'orderList',
  initialState,

  reducers: {
    setItem: (state, action) => {
      state.item = action.payload; // Simpan item ke state
    },
    clearOrderList: state => {
      state.item = null; // Clear item
    },
  },
});

export const {setItem, clearOrderList } = orderListSlice.actions;
export default orderListSlice.reducer;
