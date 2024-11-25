import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {Card} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import {baseURL} from '../../utils/url';

const HomeDashboard = ({loginData}) => {
  const [ResData, setResData] = useState([]);
  const [orderListData, setOrderList] = useState([]);
  const [putawayPlanning, setPutawayPlanning] = useState([]);
  const [confirmedPutaway, setConfirmedPutaway] = useState([]);
  const [refreshing, setRefreshing] = useState(false); // local state for refreshing
  const isFocused = useIsFocused();

  // Fetch data function
  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([getOrderList(), getFinishInbound(), getPutawayData()]);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch API data.');
    } finally {
      setRefreshing(false);
    }
  };

  const getFinishInbound = async () => {
    const api = `${baseURL}/finish-inbound/${loginData}`;
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append(
      'Cookie',
      'XSRF-TOKEN=eyJpdiI6...; wms_session=eyJpdiI6...',
    );

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    try {
      const response = await fetch(api, requestOptions);
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setResData(result.data.length);
    } catch (error) {
      console.error(error);
      Alert.alert('Error getFinishInbound', error.message);
    }
  };

  const getOrderList = async () => {
    const api = `${baseURL}/order-list/${loginData}`;
    try {
      const response = await fetch(api);
      const responseData = await response.json();
      setOrderList(responseData.data.length);
    } catch (error) {
      console.error(error);
      Alert.alert('Error getOrderList', error.message);
    }
  };

  const getPutawayData = async () => {
    const api = `${baseURL}/putaway-data/${loginData}`;
    try {
      const response = await fetch(api);
      const responseData = await response.json();
      setPutawayPlanning(responseData.putaway_planning.length);
      setConfirmedPutaway(responseData.putaway_finished.length);
    } catch (error) {
      console.error(error);
      Alert.alert('Error getPutawayData', error.message);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData(); // Fetch data when component is focused
    }
  }, [isFocused]);

  // Fungsi untuk menangani refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.contentSection}>
        <View style={styles.row}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.planTitle}>Inbound Planning</Text>
              <Text style={styles.planData}>{orderListData}</Text>
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.planTitle}>Putaway Planning</Text>
              <Text style={styles.planData}>{putawayPlanning}</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.row}>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={{fontSize: 20, color: '#424242'}}>
                Inbound Complete
              </Text>
              <Text style={{fontSize: 80, color: '#424242'}}>{ResData}</Text>
            </Card.Content>
          </Card>
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={{fontSize: 20, color: '#424242'}}>
                Putaway Confirmed
              </Text>
              <Text style={{fontSize: 80, color: '#424242'}}>
                {confirmedPutaway}
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeDashboard;

const styles = StyleSheet.create({
  contentSection: {
    flex: 1, // Menggunakan flex untuk mengatur tinggi otomatis sesuai layar
    marginTop: 60, // Jika ingin memberi jarak dengan bagian atas
    alignSelf: 'center',
  },
  userIcon: {
    backgroundColor: '#fffbef',
    width: 120,
    height: 120,
    borderRadius: 100,
    position: 'absolute',
    zIndex: 3,
    top: 15,
    right: 260,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    margin: 6,
    width: 180,
    height: 200,
    backgroundColor: '#f3f6f8',
    textAlign: 'center',
    alignContent: 'center',
    alignSelf: 'center',
  },
  cardContent: {
    alignItems: 'flex-start',
  },
  planTitle: {
    fontSize: 20,
    color: '#424242',
  },
  planData: {
    fontSize: 80,
    color: '#424242',
  },
});
