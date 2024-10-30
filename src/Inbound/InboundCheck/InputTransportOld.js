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
import {Icon, MD3Colors, Button} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {format} from 'date-fns';
import {useForm, Controller} from 'react-hook-form';
import {useDispatch, useSelector} from 'react-redux';

import {baseURL} from '../../utils/url';
import useDisableBackButton from '../../utils/useDisableBackButton';
import {setItemVehicle} from '../../Redux/Reducers/VehicleDataSlice';

const InputTransport = ({navigation}) => {
  useDisableBackButton('Anda tidak dapat kembali dari halaman ini.');
  const dispatch = useDispatch();

  const [vehicleNo, setVehicleNo] = useState('');
  const [activityId, setActivityId] = useState('');

  // Mengambil item dari state Redux
  const item = useSelector(state => state.orderList.item);
  const loginData = useSelector(state => state.loginData.item);

  // Destructuring untuk mengambil inbound_planning_no dan properti lain
  const {inbound_planning_no} = item || {};

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

  // REACT-HOOK-FORM
  const {control, handleSubmit, setValue, clearErrors} = useForm();

  useEffect(() => {
    if (!item && !loginData) {
      resetForm();
    } else {
      fetchDataFromWH();
    }
  }, [item, loginData]);

  const onRefresh = () => {
    fetchDataFromWH();
  };

  const fetchDataFromWH = async () => {
    if (!inbound_planning_no) {
      resetForm();
      return;
    }

    setLoadingDataWH(true);
    const api = `${baseURL}/get-wh-trans/${inbound_planning_no}`;

    try {
      const response = await fetch(api);
      const data = await response.json();

      console.log('GET WH TRANS', data);

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
    setVehicleNoEditable(true); // Atur kembali editable jika perlu
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

  // INSERT PARTIAL TRANSPORTATION DATA
  const savePartialVehicleData = async data => {
    const vehicleId = !typeVehicle.value ? typeVehicle : typeVehicle.value;

    if (!typeVehicle) {
      setError('typeVehicle', {
        type: 'manual',
        message: 'Vehicle Type is required',
      });
      return;
    } else {
      clearErrors('typeVehicle');
    }

    const headers = {
      'Content-Type': 'application/json',
      Cookie: 'XSRF-TOKEN=your_token; wms_session=your_session',
    };

    const body = JSON.stringify({
      vehicle_id: vehicleId,
      vehicle_no: data.vehicleNo,
      driver_name: data.driverName,
      container_no: data.containerNo,
      seal_no: data.sealNo,
      arrival_date: arrivalDate,
      start_unloading: startUnloadingDate,
      user_created: 'superadmin',
      is_active: 'Y',
      is_deleted: 'N',
    });

    const api = `${baseURL}/save-partial-vehicle/${inbound_planning_no}/${loginData}`;

    console.log('API', api);

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      const responseData = await response.json();

      console.log('Res Save Partial', responseData);

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
        fetchDataFromWH();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error(error.message);
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
      isEditable: zeroOutStanding === 'true',
    },
    {
      label: 'Departure Datetime',
      state: departureDate,
      type: 'departure',
      isEditable: zeroOutStanding === 'true',
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
            color={isEditable ? MD3Colors.secondary0 : 'lightgrey'} // Ganti warna jika tidak editable
            size={20}
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
                borderColor: error ? 'red' : 'black',
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
      user_updated: 'superadmin', // Ganti dengan user yang sesuai
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
      navigation.navigate('OrderList');
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
      Alert.alert('Mohon Isi Arrival Date dan Start Unloading dahulu');
    } else {
      navigation.navigate('ScanItem', {param: zeroOutStanding});
    }
  };

  // Menghitung rotasi
  const rotateInterpolate = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={loadingDataWH} onRefresh={onRefresh} />
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
              Inbound Planning No
            </Text>
            <TextInput
              value={inbound_planning_no}
              style={styles.inboundInfo}
              editable={false}
            />

            <View style={{paddingVertical: 5}}>
              {!typeVehicle && (
                <Text style={{color: 'red'}}>Vehicle Type is required</Text>
              )}
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
                onChange={item => {
                  setTypeVehicle(item);
                  setIsFocusDropdown(false);
                }}
                itemTextStyle={{color: 'black'}}
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

            {zeroOutStanding == 'true' ? (
              <>
                <Button
                  style={{backgroundColor: '#103f7d'}}
                  textColor="white"
                  mode="contained"
                  onPress={() => saveFinishTransportation()}>
                  Finish
                </Button>
              </>
            ) : (
              <Button
                style={{backgroundColor: '#103f7d'}}
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
        </ScrollView>
      )}

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
              transform: [{rotate: rotateInterpolate}],
            }}>
            <Icon source="barcode" color="white" size={30} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'white',
    bottom: 4,
  },
  inboundInfo: {
    borderWidth: 1,
    borderColor: 'black',
    marginBottom: 10,
    padding: 5,
    color: 'black',
    borderRadius: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#B5C0D0',
  },
  dateInput: {
    marginBottom: 10,
    backgroundColor: 'white',
    width: 300,
    borderColor: 'gray',
    margin: 2,
    color: 'black',
    borderRadius: 5,
  },
});