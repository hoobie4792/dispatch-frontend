import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Grid, Paper, List } from '@material-ui/core'
import { Widget, addResponseMessage, addUserMessage, deleteMessages, markAllAsRead, toggleWidget } from 'react-chat-widget'
import './App.css'
import 'react-chat-widget/lib/styles.css';
import MenuAppBar from './Components/MenuAppBar'
import UtilitiesContainer from './Components/UtilitiesContainer'
import MapContainer from './Components/MapContainer'
import AppointmentDetailsContainer from './Components/AppointmentDetailsContainer'
import TableBox from './Components/TableBox'
import LoginForm from './Components/LoginForm'
import AppointmentForm from './Components/AppointmentForm'
import { API_ROOT } from './services/apiRoot'

class App extends React.Component {
  state = {
    viewport: {
      latitude: 33.8145,
      longitude: -84.3539,
      height: '89.5vh',
      width: '83vw',
      zoom: 12
    },
    isLoggedIn: false,
    userData: {},
    selectedAppointments: [],
    renderedItem: 'map',
    filterParams: {
      nurse: '',
      patient: '',
      appointmentReason: '',
      appointmentStatus: '',
      date: {
        from: '',
        to: ''
      }
    },
    popupState: null,
    filteredUserData: {
      appointments: []
    },
    showMessages: false,
    messages: [],
    formApptData: {
      apptId: '',
      patient_name: '',
      start_time: '',
      length: '',
      patient_id: '',
      nurse_id: '',
      reason: '',
      notes: '',
      completed: false,
    },
    chatPerson: ''
  }

  // should we move this into a .env file?
  mapboxToken = 'pk.eyJ1IjoicnBkZWNrcyIsImEiOiJja2JiOTVrY20wMjYxMm5tcWN6Zmtkdno0In0.F_U-T3nJUgcaJGb6dO5ceQ'

  componentDidMount() {
    this.getUserData();
    if (localStorage.getItem('auth_token')) {
      this.setState({ isLoggedIn: true })
    }
  }

  handleViewportChange = viewport => {
    this.setState({
      viewport: { ...this.state.viewport, ...viewport }
    })
  }

  handleLogin = token => {
    localStorage.setItem('auth_token', token);
    this.setState({ isLoggedIn: true })
    this.getUserData();
  }

  handleLogout = () => {
    localStorage.removeItem('auth_token');
    this.setState({ isLoggedIn: false })
  }

  getUserData = () => {
    const auth_token = localStorage.getItem('auth_token');

    if (!auth_token) {
      return;
    }

    const fetchObj = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': auth_token
      }
    }

    fetch(`${API_ROOT}/get-info`, fetchObj)
      .then(res => res.json())
      .then(userData => this.setState({ userData: userData, filteredUserData: userData }))
  }

  whatToRender = () => {
    const renderedItem = this.state.renderedItem;

    if (this.state.userData.user_type === 'patient') {
      return <AppointmentDetailsContainer
        appointments={this.state.userData.appointments}
        updateRenderedItem={this.updateRenderedItem}
        userType={this.state.userData.user_type}
        getMessages={this.getMessages} />
    }

    if (renderedItem === 'map') {
      return <MapContainer
        viewport={this.state.viewport}
        mapboxApiAccessToken={this.mapboxToken}
        handleViewportChange={this.handleViewportChange} // allows to drag map inside grid
        userData={this.state.filteredUserData}
        setSelectedAppointments={this.setSelectedAppointments}
        updateRenderedItem={this.updateRenderedItem}
        setPopupState={this.setPopupState}
        popupState={this.state.popupState}
      />

    } else if (renderedItem === 'table') {
      return <TableBox userData={this.state.filteredUserData} setSelectedAppointments={this.setSelectedAppointments} updateRenderedItem={this.updateRenderedItem} />
    } else if (renderedItem === 'login') {
      return <LoginForm />
    } else if (renderedItem === 'apptForm') {
      return <AppointmentForm
        userData={this.state.userData}
        updateRenderedItem={this.updateRenderedItem}
        addAppointment={this.addAppointment}
        editAppointment={this.editAppointment}
        formApptData={this.state.formApptData}
        setFormState={this.setFormState} />
    } else if (renderedItem === 'apptDetails') {
      return <AppointmentDetailsContainer
        appointments={this.state.selectedAppointments}
        updateRenderedItem={this.updateRenderedItem}
        userType={this.state.userData.user_type}
        setFormApptData={this.setFormApptData}
        getMessages={this.getMessages}
        deleteAppointment={this.deleteAppointment} />
    }
  }

  updateRenderedItem = item => this.setState({ renderedItem: item })

  setPopupState = (user) => {
    this.setState({ popupState: user })
  }

  setSelectedAppointments = id => {
    let filteredAppointments = this.state.filteredUserData.appointments;
    const selectedAppointments = this.state.filteredUserData.appointments.filter(appointment =>
      (appointment.patient_id === id || appointment.nurse_id === id) && filteredAppointments.includes(appointment)
    );
    this.setState({
      selectedAppointments: selectedAppointments
    })
  }

  setFormApptData = appt => {
    this.setState({
      formApptData: appt
    })
  }

  setFormState = (e) => {
    this.setState({ formApptData: { ...this.state.formApptData, [e.target.name]: e.target.value } })
  }

  addAppointment = (appt) => {
    const auth_token = localStorage.getItem('auth_token');

    if (!auth_token) {
      return;
    }

    const fetchObj = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': auth_token
      },
      body: JSON.stringify({
        patient_id: appt.patient_id,
        nurse_id: appt.nurse_id,
        start_time: appt.start_time,
        length: appt.length,
        reason: appt.reason,
        notes: appt.notes
      })
    }

    fetch(`${API_ROOT}/appointments`, fetchObj)
      .then(res => res.json())
      .then(appt => {
        this.setState({
          userData: { ...this.state.userData, appointments: [...this.state.userData.appointments, appt] }
        })
      })
  }

  editAppointment = (appt) => {
    const auth_token = localStorage.getItem('auth_token');

    if (!auth_token) {
      return;
    }

    const fetchObj = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': auth_token
      },
      body: JSON.stringify({
        patient_id: appt.patient_id,
        nurse_id: appt.nurse_id,
        start_time: appt.start_time,
        length: appt.length,
        reason: appt.reason,
        notes: appt.notes
      })
    }

    fetch(`${API_ROOT}/appointments/${appt.id}`, fetchObj)
      .then(res => res.json())
      .then(appt => this.setState({
        userData: {
          ...this.state.userData,
          appointments: this.state.userData.appointments.map(appointment => {
            if (appointment.id === appt.id) {
              return {
                ...appointment,
                address: appt.address,
                completed: appt.completed,
                length: appt.length,
                nurse_id: appt.nurse_id,
                patient_id: appt.patient_id,
                reason: appt.reason,
                start_time: appt.start_time
              };
            } else {
              return appointment
            }
          })
        },
        filteredUserData: {
          ...this.state.filteredUserData,
          appointments: this.state.filteredUserData.appointments.map(appointment => {
            if (appointment.id === appt.id) {
              return {
                ...appointment,
                address: appt.address,
                completed: appt.completed,
                length: appt.length,
                nurse_id: appt.nurse_id,
                patient_id: appt.patient_id,
                reason: appt.reason,
                start_time: appt.start_time
              };
            } else {
              return appointment
            }
          })
        }
      }))
  }

  deleteAppointment = (id) => {
    const auth_token = localStorage.getItem('auth_token');

    if (!auth_token) {
      return;
    }

    const fetchObj = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': auth_token
      },
    }

    fetch(`${API_ROOT}/appointments/${id}`, fetchObj)
      .then(res => res.json())
      .then(appt => {
        let apptsCopy = [...this.state.userData.appointments]
        apptsCopy.filter(appointment => appointment.id !== appt.id)
        this.setState({ userData: { ...this.state.userData, appointments: apptsCopy } }, () => console.log(appt))
      })
  }

  updateFilteredUserData = filterParams => {
    let filteredUserData = { ...this.state.userData };

    if (filterParams.nurse) {
      filteredUserData.nurses = filteredUserData.nurses.filter(nurse => nurse.id === parseInt(filterParams.nurse))
    }

    if (filterParams.patient) {
      filteredUserData.patients = filteredUserData.patients.filter(patient => patient.id === parseInt(filterParams.patient))
    }

    if (filterParams.appointmentReason) {
      const appointments = filteredUserData.appointments.filter(appointment => appointment.reason === filterParams.appointmentReason)
      this.filterUsersFromAppointments(appointments, filteredUserData)
    }

    if (filterParams.appointmentStatus) {
      const status = filterParams.appointmentStatus === 'complete' ? true : false;
      const appointments = filteredUserData.appointments.filter(appointment => appointment.completed === status)
      this.filterUsersFromAppointments(appointments, filteredUserData)
    }

    if (filterParams.date.from) {
      const appointments = filteredUserData.appointments.filter(appointment => Date.parse(appointment.start_time) > Date.parse(filterParams.date.from));
      this.filterUsersFromAppointments(appointments, filteredUserData)
    }

    if (filterParams.date.to) {
      const appointments = filteredUserData.appointments.filter(appointment => Date.parse(appointment.start_time) < Date.parse(filterParams.date.to));
      this.filterUsersFromAppointments(appointments, filteredUserData)
    }

    this.setState({ filteredUserData: filteredUserData, filterParams: filterParams });

    return filteredUserData;
  }

  filterUsersFromAppointments = (appointments, filteredUserData) => {
    const patient_ids = appointments.map(appointment => appointment.patient_id).filter(this.onlyUnique)
    const nurse_ids = appointments.map(appointment => appointment.nurse_id).filter(this.onlyUnique)
    filteredUserData.appointments = appointments;
    filteredUserData.patients = filteredUserData.patients.filter(patient => patient_ids.includes(patient.id))
    if (filteredUserData.nurses) {
      filteredUserData.nurses = filteredUserData.nurses.filter(nurse => nurse_ids.includes(nurse.id))
    }
  }

  onlyUnique = (value, index, self) => self.indexOf(value) === index;

  getMessages = id => {
    this.fetchMessages(id)
    this.setState({ chatPerson: id })
  }

  fetchMessages = id => {
    const messageObj = {
      message: {
        userId: id
      }
    }

    const fetchObj = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': localStorage.getItem('auth_token')
      },
      body: JSON.stringify(messageObj)
    }

    fetch(`${API_ROOT}/get-messages`, fetchObj)
      .then(res => res.json())
      .then(messages => {
        this.writeMessages(messages)
      })
  }

  writeMessages = messages => {
    deleteMessages()
    messages.forEach(message => {
      if (message.sender === 'self') {
        addUserMessage(message.content)
      } else {
        addResponseMessage(message.content)
      }
    })
    this.setState({ showMessages: true })
    markAllAsRead()
    toggleWidget()
  }

  handleNewUserMessage = message => {
    const fetchObj = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': localStorage.getItem('auth_token')
      },
      body: JSON.stringify({
        "message": {
          "content": message,
          "userId": this.state.chatPerson
        }
      })
    }

    fetch(`${API_ROOT}/messages`, fetchObj)
      .then(res => res.json())
      .then(message => console.log(message.content))
      .catch(error => alert(error.msg))
  }

  render() {
    return (
      <BrowserRouter>
        <MenuAppBar isLoggedIn={this.state.isLoggedIn} updateRenderedItem={this.updateRenderedItem} handleLogout={this.handleLogout} />
        <Grid container >
          {/* <Grid item xs={12} className='header'> */}
          {/* </Grid> */}
          <Grid item xs={2}>
            <div className='nav-left'>
              <Paper style={{ height: '89.7vh', overflow: 'auto' }}>
                <List>
                  <UtilitiesContainer
                    filterParams={this.state.filterParams}
                    updateFilteredUserData={this.updateFilteredUserData}
                    userData={this.state.userData}
                    updateRenderedItem={this.updateRenderedItem}
                    renderedItem={this.state.renderedItem}
                  />
                </List>
              </Paper>
            </div>
          </Grid>
          <Switch>
            <Route exact path='/'>
              <Grid container item xs={10} className='main-display'>
                <Paper style={{ maxHeight: '90vh', overflow: 'auto', width: '90vw' }}>
                  {this.whatToRender()}
                </Paper>
              </Grid>
            </Route>
            <Route exact path='/login'>
              <LoginForm handleLogin={this.handleLogin} />
            </Route>
          </Switch>
        </Grid>
        {this.state.showMessages && <Widget handleNewUserMessage={this.handleNewUserMessage} />}
      </BrowserRouter>
    )
  };
}

export default App;
