import {
  StyleSheet,
  View,
  Dimensions,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {PieChart} from 'react-native-gifted-charts';
import {Divider, Text, Icon, MD3Colors, Avatar, Card} from 'react-native-paper';

import {useDispatch, useSelector} from 'react-redux';
import {setItem} from '../../../Redux/Reducers/PutAwaySlice';

import {baseURL} from '../../../utils/url';

const screenWidth = Dimensions.get('window').width;

const PutAway = ({navigation}) => {
  const dispatch = useDispatch();

  const loginData = useSelector(state => state.loginData.item);


  const handlePress = item => {
    console.log('Item', item);

    dispatch(setItem(item));

    navigation.navigate('Scan PutAway');
  };

  const [orderListData, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getOrderList();
  }, []);

  const getOrderList = async () => {
    setLoading(true);
    const api = `${baseURL}/order-putaway/${loginData}`;

    try {
      const response = await fetch(api);
      const responseData = await response.json();
      setOrderList(responseData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch order list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    getOrderList();
  };

  return (
    <View style={styles.container}>
      <Divider />

      <View style={styles.orderListSection}>
        <Text>{'\n'}</Text>

        <View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <FlatList
              data={orderListData}
              renderItem={({item, index}) => (
                <TouchableOpacity onPress={() => handlePress(item)}>
                  <Card style={{backgroundColor: 'lightgrey', margin: 10}}>
                    <Card.Title
                      title={`GR-ID: ${item.gr_id}`}
                      titleStyle={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                      subtitle={`MOV-ID: ${item.movement_id}`}
                      subtitleStyle={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 11,
                      }}
                      left={() => (
                        <Avatar.Icon
                          size={45}
                          icon="cube-send"
                          style={{backgroundColor: 'green'}}
                        />
                      )}
                      // right={() => (
                      //   <Text style={{color: 'grey', fontSize: 11, margin: 10}}>
                      //     {item.datetime_created}
                      //   </Text>
                      // )}
                    />
                    <Card.Content>
                      {/* <Text
                        variant="bodyMedium"
                        style={{
                          color: 'grey',
                          left: 55,
                          fontSize: 13,
                          fontWeight: 'bold',
                        }}>
                        {`${item.warehouseman}`}
                      </Text>

                      <Text
                        variant="bodyMedium"
                        style={{
                          color: 'grey',
                          left: 55,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>
                        {`Location To: ${item.location_to}`}
                      </Text> */}

                      <Text
                        variant="bodyMedium"
                        style={{
                          color: 'grey',
                          left: 55,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>
                        {`SKU: ${item.sku}`}
                      </Text>

                      <Text
                        variant="bodyMedium"
                        style={{
                          color: 'grey',
                          left: 55,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}>
                        {`Quantity: ${item.qty}`}
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              ListFooterComponent={<View style={{height: 55}} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
          <Text>{'\n'}</Text>
        </View>
      </View>
    </View>
  );
};

export default PutAway;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'whitesmoke',
  },
  titleChart: {
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    bottom: 10,
  },
  txtTitle: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // CHART ADJUSTMENT
  chartSection: {
    marginTop: 20,
    marginBottom: 10,
    width: screenWidth,
  },
  chartWarp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    top: 10,
    padding: 10,
    marginBottom: 10,
  },
  txtChart: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontWeight: 'bold',
  },

  // ORDER LIST SECTION
  orderListSection: {
    flex: 1,
    width: screenWidth,
  },
  titleOrder: {
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    margin: 10,
  },

  // SEPARATOR
  separator: {
    height: 1,
    backgroundColor: 'black',
  },
});
