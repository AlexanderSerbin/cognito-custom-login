import React, { Component } from 'react'
import * as Auth from '../utils/Auth'
import ForgotPasswordForm from './ForgotPasswordForm'
import {validatePassword} from '../utils/validatePassword'
import ResetPasswordForm from './ResetPasswordForm'

// TODO - redirect_uri on the url?  save it to state
/* eslint camelcase: 0 */
class ForgotPasswordPage extends Component {
  constructor (props, context) {
    super(props, context)

    this.state = {
      reseting: false,
      email: '',
      errorMsg: undefined,
      new_password: '',
      confirm_password: '',
      disableResetPassword: false,
      maxLength: false,
      lowerCase: false,
      upperCase: false,
      number: false,
      code: '',
      specialCharacter: false,
      disableChangePasswordBtn: true
    }
    this.showResetArea = this.showResetArea.bind(this)
    this.showError = this.showError.bind(this)
    this.updateEmailState = this.updateEmailState.bind(this)
    this.onEmailSubmit = this.onEmailSubmit.bind(this)
    this.updateCodeState = this.updateCodeState.bind(this)
    this.updateNewPasswordState = this.updateNewPasswordState.bind(this)
    this.updateConfirmPasswordState = this.updateConfirmPasswordState.bind(this)
    this.changePassword = this.changePassword.bind(this)
    this.mask = this.mask.bind(this)
    this.onCancel = this.onCancel.bind(this)
    this.disableChangePasswordBtn = this.disableChangePasswordBtn.bind(this)
  }

  mask (email) {
    return email.replace(/^(.)(.*)(.@.*)$/,
      (_, a, b, c) => a + b.replace(/./g, '*') + c
    )
  }

  onEmailSubmit (event) {
    event.preventDefault()
    const showResetArea = this.showResetArea
    const showError = this.showError
    const cognitoUser = Auth.createUser(this.state)
    this.setState({
      cognitoUser: cognitoUser,
      disableResetPassword: true
    })

    cognitoUser.forgotPassword({
      onFailure: err => {
        if (err.code === 'InvalidParameterException') {
          showError('Email is required')
        } else {
          showError(err.message)
        }
      },
      inputVerificationCode () {
        showResetArea()
      }
    })
  }

  updateEmailState (event) {
    this.setState({
      email: event.target.value
    })
  }

  updateCodeState (event) {
    const {new_password, confirm_password} = this.state
    this.setState({
      code: event.target.value
    })
    this.disableChangePasswordBtn(new_password, confirm_password, event.target.value)
  }

  updateNewPasswordState (event) {
    const {confirm_password, code} = this.state
    this.setState({
      new_password: event.target.value
    })
    validatePassword(this, event.target.value)
    this.disableChangePasswordBtn(event.target.value, confirm_password, code)
  }

  updateConfirmPasswordState (event) {
    const {new_password, code} = this.state
    this.setState({
      confirm_password: event.target.value
    })
    this.disableChangePasswordBtn(new_password, event.target.value, code)
  }

  disableChangePasswordBtn (new_password, confirm_password, code) {
    if (new_password && confirm_password && code) {
      this.setState({ disableChangePasswordBtn: false })
    } else {
      this.setState({ disableChangePasswordBtn: true })
    }
  }

  showResetArea () {
    this.setState({
      errorMsg: '',
      reseting: true,
      email: this.mask(this.state.email),
      code: '',
      new_password: '',
      confirm_password: ''
    })
  }

  showError (msg) {
    this.setState({
      errorMsg: msg,
      disableResetPassword: false
    })
  }

  onCancel () {
    const props = this.props
    props.history.push('/login')
  }

  changePassword (event) {
    event.preventDefault()
    const showError = this.showError
    const cognitoUser = this.state.cognitoUser
    const props = this.props
    switch (this.state.confirm_password) {
      case this.state.new_password:
        cognitoUser.confirmPassword(this.state.code.trim(), this.state.new_password, {
          onSuccess: () => {
            props.history.push('/login')
            props.history.push({msg: 'Password has been reset successfully. Please use your new password to login.'})
          },
          onFailure: err => {
            if (err.code === 'InvalidParameterException') {
              showError('Password does not conform to policy: Password not long enough')
            } else {
              showError(err.message)
            }
          }
        })
        break
      default: {
        this.setState({
          new_password: '',
          confirm_password: '',
          disableChangePasswordBtn: true
        })
        showError('Passwords do not match')
      }
    }
  }

  render () {
    if (this.state.reseting) {
      return (
        <ResetPasswordForm
          validateLength={this.state.maxLength}
          validateLowerCase={this.state.lowerCase}
          validateUpperCase={this.state.upperCase}
          validateNumber={this.state.number}
          validateSpecialCharacter={this.state.specialCharacter}
          email={this.state.email}
          errorMsg={this.state.errorMsg}
          code={this.state.code}
          newPassword={this.state.new_password}
          confirmPassword={this.state.confirm_password}
          disableChangePasswordBtn={this.state.disableChangePasswordBtn}
          onCodeChange={this.updateCodeState}
          onNewPasswordChange={this.updateNewPasswordState}
          onConfirmPasswordChange={this.updateConfirmPasswordState}
          onSubmit={event => this.changePassword(event)}/>)
    } else {
      return (
        <ForgotPasswordForm
          errorMsg={this.state.errorMsg}
          email={this.state.email}
          onChange={this.updateEmailState}
          disableResetPassword={this.state.disableResetPassword}
          onCancel={this.onCancel}
          onSubmit={event => this.onEmailSubmit(event)}/>)
    }
  }
}

export default ForgotPasswordPage
