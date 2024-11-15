import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Icon,
  MD3Colors,
  Button,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {format} from 'date-fns';
import {useForm, Controller} from 'react-hook-form';
import {useDispatch, useSelector} from 'react-redux';

import {baseURL} from '../../utils/url';
import useDisableBackButton from '../../utils/useDisableBackButton';
import {setItemVehicle} from '../../Redux/Reducers/VehicleDataSlice';

const InputTransport = ({navigation, route}) => {
  useDisableBackButton('Anda tidak dapat kembali dari halaman ini.');
  const dispatch = useDispatch();

  // const {checkQtyScanValidity} = route.params;
  const {param} = route.params;
  const checkQtyScanValidity = param;

  const [vehicleNo, setVehicleNo] = useState('');
  const [activityId, setActivityId] = useState('');

  // Mengambil item dari state Redux
  const item = useSelector(state => state.orderList.item);
  const loginData = useSelector(state => state.loginData.item);

  // Destructuring untuk mengambil inbound_planning_no dan properti lain
  const {inbound_planning_no, main_checker} = item || {};

  const [arrivalDate, setArrivalDate] = useState('');
  const [startUnloadingDate, setStartUnloadingDate] = useState('');
  const [finishUnloadingDate, setFinishUnloadingDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  const [typeVehicle, setTypeVehicle] = useState(null);

  const [isFocusDropdown, setIsFocusDropdown] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [currentDateType, setCurrentDateType] = useState('');
  const [dataVehicle, setDataVehicle] = useState([]);
  const [isVehicleNoEditable, setVehicleNoEditable] = useState(true);

  const [loadingDataWH, setLoadingDataWH] = useState(false);
  const [zeroOutStanding, setIsZeroOutStanding] = useState('');

  const [selectedVehicleNo, setSelectedVehicleNo] = useState('');
  const [vehicleSelected, setVehicleSelected] = useState(false);

  // REACT-HOOK-FORM
  const {control, handleSubmit, setValue, clearErrors} = useForm();

  useEffect(() => {
    if (!item && !loginData) {
      resetForm();
    } else {
      // fetchDataFromWH();
      getVehicleNo();
    }
  }, [item, loginData]);

  const onRefresh = () => {
    // fetchDataFromWH();
    getVehicleNo();
  };

  const [vehicleNumbers, setVehicleNumbers] = useState([]);

  const getVehicleNo = async () => {
    const api = `${baseURL}/get-vehicle-no/${inbound_planning_no}/${main_checker}`;

    try {
      const response = await fetch(api);
      const data = await response.json();

      const formatData = data.map(item => ({
        label: item.vehicle_no,
        value: item.vehicle_no,
      }));

      const vehicleNumbers = [
        ...formatData,
        {label: 'Add New Vehicle', value: 'add_new_vehicle'},
      ];

      if (loginData == main_checker) {
        setVehicleNumbers(vehicleNumbers);
      } else {
        setVehicleNumbers(formatData);
      }
    } catch (error) {
      console.error('Fetch get data WH Error:', error);
    }
  };

  const handleDropdownChange = item => {
    setVehicleSelected(true);
    setSelectedVehicleNo(item.value);
    fetchDataFromWH(item.value);
    if (item.value === 'add_new_vehicle') {
      resetForm();
    }
  };

  const fetchDataFromWH = async vehicleNo => {
    if (!inbound_planning_no && vehicleNo) {
      resetForm();
      return;
    }

    // setLoadingDataWH(true);
    const api = `${baseURL}/get-wh-trans/${inbound_planning_no}/${main_checker}/${vehicleNo}`;

    try {
      const response = await fetch(api);
      const data = await response.json();

      // Check if data is an array and has at least one element
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0]; // Get the first item from the array

        // Check conditions based on the first item
        if (firstItem.arrival_date && firstItem.start_unloading) {
          dispatch(setItemVehicle(firstItem));

          setTypeVehicle(firstItem.vehicle_id, {shouldValidate: false});

          setValue('vehicleNo', firstItem.vehicle_no, {shouldValidate: false});
          setValue('driverName', firstItem.driver_name, {
            shouldValidate: false,
          });
          setValue('containerNo', firstItem.container_no, {
            shouldValidate: false,
          });
          setValue('sealNo', firstItem.seal_no, {shouldValidate: false});

          setArrivalDate(firstItem.arrival_date);
          setStartUnloadingDate(firstItem.start_unloading);
          setFinishUnloadingDate(firstItem.finish_unloading);
          setDepartureDate(firstItem.departure_date);

          setActivityId(firstItem.activity_id);
          setVehicleNo(firstItem.vehicle_no);

          // Clear any errors for the inputs being filled automatically
          clearErrors(['vehicleNo', 'driverName', 'containerNo', 'sealNo']);

          // Set Vehicle No as not editable
          setVehicleNoEditable(false);

          setIsZeroOutStanding(firstItem.is_outstanding_zero);
        } else {
          // If conditions are not met, reset relevant state
          resetForm();
        }
      } else {
        // If data is empty, reset state
        resetForm();
      }
    } catch (error) {
      console.error('Fetch WH table Error:', error);
    } finally {
      setLoadingDataWH(false);
    }
  };

  // RESET FORM
  const resetForm = () => {
    setTypeVehicle('');
    setValue('vehicleNo', '');
    setValue('driverName', '');
    setValue('containerNo', '');
    setValue('sealNo', '');
    setVehicleNoEditable(true);
    setArrivalDate('');
    setStartUnloadingDate('');
    setFinishUnloadingDate('');
    setDepartureDate('');
  };

  // GET VEHICLE DATA
  useEffect(() => {
    const api = `${baseURL}/get-vehicle`;

    fetch(api)
      .then(response => response.json())
      .then(data => {
        const dropdownData = data.map(vehicle => ({
          label: vehicle.vehicle_type,
          value: vehicle.vehicle_id,
        }));
        setDataVehicle(dropdownData);
      })
      .catch(error => {
        console.error('fetch vehicle data:', error);
      });
  }, []);

  const [errorVisible, setErrorVisible] = useState(false);

  const onDismissSnackBar = () => setErrorVisible(false);

  const hasErrors = () => {
    return typeVehicle.value == undefined;
  };

  // INSERT PARTIAL TRANSPORTATION DATA
  const savePartialVehicleData = async data => {
    if (hasErrors()) {
      setErrorVisible(true); // Set error visible jika ada kesalahan
    } else {
      // Lakukan aksi untuk menyimpan data
      setErrorVisible(false);
    }

    const vehicleId = !typeVehicle.value ? typeVehicle : typeVehicle.value;

    const headers = {
      'Content-Type': 'application/json',
      Cookie: 'XSRF-TOKEN=your_token; wms_session=your_session',
    };

    const body = {
      vehicle_id: vehicleId,
      vehicle_no: data.vehicleNo,
      driver_name: data.driverName,
      container_no: data.containerNo,
      seal_no: data.sealNo,
      arrival_date: arrivalDate,
      start_unloading: startUnloadingDate,
      user_created: loginData,
      is_active: 'Y',
      is_deleted: 'N',
    };

    const emptyFields = [];

    // Memeriksa field di objek body, bukan string
    for (const [key, value] of Object.entries(body)) {
      // Memeriksa jika value adalah string dan kosong, atau undefined
      if (value === '' || value === undefined) {
        emptyFields.push(key);
      }
    }

    if (emptyFields.length > 0) {
      Alert.alert(
        'Field Kosong',
        `Berikut adalah field yang masih kosong: ${emptyFields.join(', ')}`,
      );
    } else {
      // Mengubah body menjadi string setelah validasi
      const bodyString = JSON.stringify(body);
      const api = `${baseURL}/save-partial-vehicle/${inbound_planning_no}/${loginData}`;

      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: headers,
          body: bodyString,
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Mengambil detail kesalahan dari responseData
          const errors = responseData.errors;

          // Membuat pesan error dari detail kesalahan`
          let errorMessage = 'Validation Errors:\n';
          for (const key in errors) {
            errorMessage += `${key}: ${errors[key].join(', ')}\n`;
          }

          throw new Error(errorMessage.trim());
        } else {
          Alert.alert('Success', 'Vehicle data saved successfully!');
          navigation.navigate('InboundOrder', {
            screen: 'OrderList',
          });
          resetForm();
        }
      } catch (error) {
        Alert.alert('Error', error.message);
        console.error(error.message);
      }
    }
  };

  // DATEPICKER
  const showDatePicker = type => {
    setCurrentDateType(type);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const selectDate = date => {
    hideDatePicker();
    const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
    switch (currentDateType) {
      case 'arrival':
        setArrivalDate(formattedDate);
        break;
      case 'startUnloading':
        setStartUnloadingDate(formattedDate);
        break;
      case 'finishUnloading':
        setFinishUnloadingDate(formattedDate);
        break;
      case 'departure':
        setDepartureDate(formattedDate);
        break;
      default:
        break;
    }
  };

  const dateFields = [
    {
      label: 'Arrival Datetime',
      state: arrivalDate,
      type: 'arrival',
      isEditable: true, // Selalu editable
    },
    {
      label: 'Start Unloading Datetime',
      state: startUnloadingDate,
      type: 'startUnloading',
      isEditable: true, // Selalu editable
    },
    {
      label: 'Finish Unloading Datetime',
      state: finishUnloadingDate,
      type: 'finishUnloading',
      isEditable: checkQtyScanValidity == true,
      // isEditable: true,
    },
    {
      label: 'Departure Datetime',
      state: departureDate,
      type: 'departure',
      isEditable: checkQtyScanValidity == true,
      // isEditable: true,
    },
  ];

  const DatePickerField = ({label, value, onShow, isEditable}) => (
    <View style={{top: 20}}>
      <Text style={{color: 'grey', fontWeight: 'bold'}}>{label}:</Text>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <TextInput value={value} style={styles.dateInput} editable={false} />
        <TouchableOpacity
          onPress={isEditable ? onShow : null}
          style={styles.iconCalender}
          disabled={!isEditable}>
          <Icon
            source="calendar"
            color={isEditable ? MD3Colors.secondary0 : 'lightgrey'}
            size={25}
            style={{alignSelf: 'center'}}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  //END OF DATEPICKER

  // INPUT SECTION
  const inputFields = [
    {name: 'vehicleNo', label: 'Vehicle No'},
    {name: 'driverName', label: 'Driver Name'},
    {name: 'containerNo', label: 'Container No'},
    {name: 'sealNo', label: 'Seal No'},
  ];

  const ControlledInput = ({control, name, label, editable = true}) => {
    return (
      <Controller
        control={control}
        name={name}
        defaultValue=""
        rules={{required: `${label} is required`}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <View style={{top: 5}}>
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}

            <Text style={{color: 'grey', fontWeight: 'bold'}}>{label}:</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              editable={editable}
              style={{
                borderWidth: 1,
                borderColor: error ? 'red' : 'lightgrey',
                marginBottom: 10,
                padding: 5,
                color: 'black',
                borderRadius: 5,
              }}
            />
          </View>
        )}
      />
    );
  };

  // SAVE FINISH TRANSPORTATION
  const saveFinishTransportation = async () => {
    const _url = `${baseURL}/save-finish-vehicle/${activityId}/${vehicleNo}`;

    const headers = {
      'Content-Type': 'application/json',
      Cookie: 'XSRF-TOKEN=your_token; wms_session=your_session',
    };

    const body = JSON.stringify({
      finish_unloading: finishUnloadingDate, // Ganti dengan nilai yang sesuai
      departure_date: departureDate, // Ganti dengan nilai yang sesuai
      user_updated: loginData, // Ganti dengan user yang sesuai
    });

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: body,
    };

    try {
      const response = await fetch(_url, requestOptions);
      const result = await response.text();

      if (!response.ok) {
        throw new Error(`Error: ${result}`);
      }
      Alert.alert('Success', 'Vehicle transportation finished successfully!');
      navigation.navigate('InboundNavigator', {
        screen: 'OrderList',
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const resetAnimations = () => {
    rotateAnim.setValue(0); // Reset nilai rotasi
    scrollY.setValue(0); // Reset warna
  };

  const GoToScan = () => {
    resetAnimations();
    rotateAnim.stopAnimation();

    if (arrivalDate === '' && startUnloadingDate === '') {
      Alert.alert('Mohon isi data atau pilih vehicle no, sebelum scan item.');
    } else {
      navigation.navigate('ScanItem', {param: checkQtyScanValidity});
    }
  };

  // Menghitung warna berdasarkan scroll
  const backgroundColorInterpolate = scrollY.interpolate({
    inputRange: [0, 200], // Ganti sesuai dengan tinggi scroll yang diinginkan
    outputRange: ['grey', 'purple'],
  });

  return (
    <SafeAreaView>
      {loadingDataWH ? (
        <View style={{top: 100}}>
          <ActivityIndicator size="large" color="#279EFF" />
        </View>
      ) : (
        <>
          {/* <View style={{zIndex: 1}}>
            <Snackbar
              style={{backgroundColor: '#F95454', top: 63}}
              visible={errorVisible}
              onDismiss={onDismissSnackBar}
              action={{
                label: 'close',
              }}>
              <Text style={{color: 'white'}}>Please Select Vehicle Type!</Text>
            </Snackbar>
          </View> */}

          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={loadingDataWH}
                onRefresh={onRefresh}
              />
            }
            onScroll={Animated.event(
              [{nativeEvent: {contentOffset: {y: scrollY}}}],
              {useNativeDriver: false},
            )}
            scrollEventThrottle={16}>
            <View style={{padding: 20}}>
              <View>
                <Text
                  style={{
                    color: 'black',
                    fontSize: 20,
                    fontWeight: 'bold',
                    margin: 0,
                    bottom: 10,
                  }}>
                  Vehicle Info
                </Text>
              </View>

              <Text style={{color: 'grey', fontWeight: 'bold'}}>
                Inbound Planning Number
              </Text>
              <TextInput
                value={inbound_planning_no}
                style={styles.inboundInfo}
                editable={false}
              />

              <View style={{paddingVertical: 1}}>
                <Text style={{color: 'grey', fontWeight: 'bold', bottom: 1}}>
                  Select Vehicle Number
                </Text>

                <Dropdown
                  style={[
                    styles.dropdown,
                    isFocusDropdown && {borderColor: 'green'},
                  ]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  data={vehicleNumbers}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Vehicle No"
                  searchPlaceholder="Search..."
                  itemTextStyle={{color: 'black'}}
                  onChange={handleDropdownChange}
                />
              </View>

              {/* { main_checker === loginData ? (
                <View>
                  <View style={{paddingVertical: 6}}>
                    <Text>{'\n'}</Text>

                    <Text style={{color: 'grey', fontWeight: 'bold'}}>
                      Vehicle type
                    </Text>

                    <Dropdown
                      style={[
                        styles.dropdown,
                        isFocusDropdown && {borderColor: 'green'},
                      ]}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={styles.inputSearchStyle}
                      data={dataVehicle}
                      search
                      maxHeight={300}
                      labelField="label"
                      valueField="value"
                      placeholder="Vehicle Type"
                      searchPlaceholder="Search..."
                      value={typeVehicle}
                      onFocus={() => setIsFocusDropdown(true)}
                      onBlur={() => setIsFocusDropdown(false)}
                      itemTextStyle={{color: 'black'}}
                      onChange={item => {
                        setTypeVehicle(item);
                        setIsFocusDropdown(false);
                        setErrorVisible(false);
                      }}
                    />
                  </View>

                  {inputFields.map(field => (
                    <ControlledInput
                      key={field.name}
                      control={control}
                      name={field.name}
                      label={field.label}
                      editable={
                        field.name === 'vehicleNo' ? isVehicleNoEditable : true
                      }
                    />
                  ))}

                  <Text>{'\n'}</Text>

                  <View>
                    <Text
                      style={{
                        color: 'black',
                        fontSize: 20,
                        fontWeight: 'bold',
                        margin: 0,
                        top: 10,
                      }}>
                      Vehicle Activity
                    </Text>
                  </View>

                  {dateFields.map(({label, state, type, isEditable}) => (
                    <DatePickerField
                      key={type}
                      label={label}
                      value={state}
                      onShow={() => showDatePicker(type)}
                      isEditable={isEditable}
                    />
                  ))}

                  <Text>{'\n'}</Text>
                  <Text>{'\n'}</Text>

                  {checkQtyScanValidity == true ? (
                    <>
                      <Button
                        style={{backgroundColor: '#059212'}}
                        textColor="white"
                        mode="contained"
                        onPress={() => saveFinishTransportation()}>
                        Finish
                      </Button>
                    </>
                  ) : (
                    <Button
                      style={{backgroundColor: '#059212'}}
                      textColor="white"
                      mode="contained"
                      onPress={handleSubmit(savePartialVehicleData)}>
                      Save Vehicle
                    </Button>
                  )}

                  <Text>{'\n'}</Text>
                  <Text>{'\n'}</Text>

                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="datetime"
                    onConfirm={selectDate}
                    onCancel={hideDatePicker}
                  />
                </View>
              ) : (
                <View style={{paddingVertical: 1}}>
                  <Text style={{color: 'grey', fontWeight: 'bold'}}>
                    Vehicle Number
                  </Text>
                  <Dropdown
                    style={[
                      styles.dropdown,
                      isFocusDropdown && {borderColor: 'green'},
                    ]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    data={vehicleNumbers}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Vehicle No"
                    searchPlaceholder="Search..."
                    itemTextStyle={{color: 'black'}}
                    onChange={handleDropdownChange}
                  />

                  <Text>{'\n'}</Text>
                  <Text>{'\n'}</Text>
                </View>
              )} */}
              {main_checker === loginData ? (
                vehicleSelected ? (
                  <>
                    <View style={{paddingVertical: 6}}>
                      <HelperText
                        style={{color: 'red'}}
                        type="error"
                        visible={errorVisible}>
                        Please Select Vehicle Type!
                      </HelperText>
                      <Text style={{color: 'grey', fontWeight: 'bold'}}>
                        Vehicle type
                      </Text>

                      <Dropdown
                        style={[
                          styles.dropdown,
                          isFocusDropdown && {borderColor: 'green'},
                        ]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        data={dataVehicle}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Vehicle Type"
                        searchPlaceholder="Search..."
                        value={typeVehicle}
                        onFocus={() => setIsFocusDropdown(true)}
                        onBlur={() => setIsFocusDropdown(false)}
                        itemTextStyle={{color: 'black'}}
                        onChange={item => {
                          setTypeVehicle(item);
                          setIsFocusDropdown(false);
                          setErrorVisible(false);
                        }}
                      />
                    </View>

                    {inputFields.map(field => (
                      <ControlledInput
                        key={field.name}
                        control={control}
                        name={field.name}
                        label={field.label}
                        editable={
                          field.name === 'vehicleNo'
                            ? isVehicleNoEditable
                            : true
                        }
                      />
                    ))}

                    <Text>{'\n'}</Text>

                    <View>
                      <Text
                        style={{
                          color: 'black',
                          fontSize: 20,
                          fontWeight: 'bold',
                          margin: 0,
                          top: 10,
                        }}>
                        Vehicle Activity
                      </Text>
                    </View>

                    {dateFields.map(({label, state, type, isEditable}) => (
                      <DatePickerField
                        key={type}
                        label={label}
                        value={state}
                        onShow={() => showDatePicker(type)}
                        isEditable={isEditable}
                      />
                    ))}

                    <Text>{'\n'}</Text>
                    <Text>{'\n'}</Text>

                    {checkQtyScanValidity ? (
                      <Button
                        style={{backgroundColor: '#059212'}}
                        textColor="white"
                        mode="contained"
                        onPress={() => saveFinishTransportation()}>
                        Finish
                      </Button>
                    ) : (
                      <Button
                        style={{backgroundColor: '#059212'}}
                        textColor="white"
                        mode="contained"
                        onPress={handleSubmit(savePartialVehicleData)}>
                        Save Vehicle
                      </Button>
                    )}

                    <Text>{'\n'}</Text>
                    <Text>{'\n'}</Text>

                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="datetime"
                      onConfirm={selectDate}
                      onCancel={hideDatePicker}
                    />
                  </>
                ) : (
                  <></>
                )
              ) : (
                <>
                  <Text>{'\n'}</Text>
                  <Text>{'\n'}</Text>
                </>
                // <View style={{paddingVertical: 1}}>
                //   <Text style={{color: 'grey', fontWeight: 'bold'}}>
                //     Vehicle Number
                //   </Text>
                //   <Dropdown
                //     style={[
                //       styles.dropdown,
                //       isFocusDropdown && {borderColor: 'green'},
                //     ]}
                //     placeholderStyle={styles.placeholderStyle}
                //     selectedTextStyle={styles.selectedTextStyle}
                //     inputSearchStyle={styles.inputSearchStyle}
                //     data={vehicleNumbers}
                //     search
                //     maxHeight={300}
                //     labelField="label"
                //     valueField="value"
                //     placeholder="Vehicle No"
                //     searchPlaceholder="Search..."
                //     itemTextStyle={{color: 'black'}}
                //     onChange={handleDropdownChange}
                //   />

                //   <Text>{'\n'}</Text>
                //   <Text>{'\n'}</Text>
                // </View>
              )}
            </View>
          </ScrollView>
        </>
      )}

      {vehicleSelected ? (
        <>
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              bottom: 16,
              right: 16,
            }}>
            <TouchableWithoutFeedback onPress={GoToScan}>
              <Animated.View
                style={{
                  backgroundColor: backgroundColorInterpolate,
                  width: 50,
                  height: 50,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon source="barcode" color="white" size={30} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </>
      ) : (
        <></>
      )}
    </SafeAreaView>
  );
};

export default InputTransport;

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: 'white',
  },
  placeholderStyle: {
    fontSize: 16,
    color: 'black',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: 'black',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: 'black',
    borderRadius: 10,
  },
  iconCalender: {
    // flex: 1,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'transparent',
    bottom: 4,
    right: 40,
  },
  inboundInfo: {
    borderWidth: 1,
    borderColor: 'lightgrey',
    marginBottom: 10,
    padding: 5,
    color: 'white',
    borderRadius: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#103f7d',
    top: 1,
  },
  dateInput: {
    marginBottom: 10,
    backgroundColor: 'white',
    width: 340,
    margin: 2,
    color: 'black',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'lightgrey',
  },
});
