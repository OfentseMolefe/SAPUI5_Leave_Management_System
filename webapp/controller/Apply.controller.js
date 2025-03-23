sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat",
    "sap/ui/unified/Calendar",
    "sap/ui/model/json/JSONModel",
  ],
  (Controller, MessageBox, Fragment, DateFormat, Calendar, JSONModel) =>
    Controller.extend("com.emls.controller.Apply", {
      onInit: function () {
        //create empty JSONModel
        this.getView().setModel(new JSONModel(), "leaveDetails");
        // Check for existing session
        const userData = localStorage.getItem('userData');
        const userRole = localStorage.getItem('userRole');

        // initialise the model for enhanced calendar
        this._initModels();

        // Redirect if no valid session
        if (userRole !== 'employee' || !userData) {
          this.getOwnerComponent().getRouter().navTo("RouteMainView");
          return;
        }

        // Load user data into component model
        if (!this.getOwnerComponent().getModel("userData")) {
          this.getOwnerComponent().setModel(
            new JSONModel(JSON.parse(userData)),
            "userData"
          );
        }

        this._loadEmployeeData()
        this._loadLeaveTypes()

        var oLeaveApplicationModel = new JSONModel({
          LeaveType: "",
          FromDate: null,
          ToDate: null,
          Description: "",
        })
        this.getView().setModel(oLeaveApplicationModel, "leaveApplication")

      },


      _loadEmployeeData: function () {
        var oUserData = this.getOwnerComponent().getModel("userData").getData()
        this.getView().setModel(new JSONModel(oUserData), "employee")
        console.log("Employee Data:", oUserData)
      },

      _loadLeaveTypes: function () {
        fetch("http://localhost:3000/leavetype")
          .then((response) => response.json())
          .then((data) => {
            var oLeaveTypesModel = new JSONModel(data)
            this.getView().setModel(oLeaveTypesModel, "leaveTypes")
            this._loadLeaveStatus()
          })
          .catch((error) => {
            console.error("Error fetching leave types:", error)
            MessageBox.error("Failed to load leave types. Please try again.")
          })
      },

      _loadLeaveStatus: function () {
        var oUserData = this.getView().getModel("employee").getData();
        fetch(`http://localhost:3000/leave/employee/${oUserData.id}`)
          .then((response) => response.json())
          .then((data) => {
            var latestLeave = data[data.length - 1];
            const oModel = this.getView().getModel("employee");

            if (latestLeave) {
              oModel.setProperty("/leaveStatus", latestLeave.Status);
              oModel.setProperty("/latestLeaveType", latestLeave.LeaveType);
              console.log("Leave Status:", latestLeave.Status);
            } else {
              oModel.setProperty("/leaveStatus", -1);  // Special value for no leave
              oModel.setProperty("/latestLeaveType", "No leave requests");
            }
          })
          .catch((error) => {
            console.error("Error fetching leave status:", error);
            MessageBox.error("Failed to load leave status. Please try again.");
          });
      }
      ,
      formatLeaveStatus: function (status) {
        const statusMap = {
          0: "Submitted",
          1: "Approved",
          2: "Pending Approval",
          3: "Rejected",
          4: "Revoked" // Add revoked status
        };
        return statusMap[status] || "Unknown Status";
      },

      formatStatusIcon: function (status) {
        switch (status) {
          case 0: return "sap-icon://status-in-process";  // Submitted
          case 1: return "sap-icon://accept";             // Approved
          case 2: return "sap-icon://pending";            // Pending
          case 3: return "sap-icon://decline";            // Rejected
          default: return "sap-icon://bed";               // No active leave
        }
      },

      onOpenMenu: function (oEvent) {
        if (!this._oMenu) {
          this._oMenu = sap.ui.xmlfragment("com.emls.view.fragments.SidebarMenu", this)
          this.getView().addDependent(this._oMenu)
        }
        var oButton = oEvent.getSource()
        this._oMenu.openBy(oButton)
      },

      onCloseMenu: function () {
        this._oMenu.close()
      },

      onMyProfile: function () {
        if (!this._oProfileDialog) {
          this._oProfileDialog = sap.ui.xmlfragment("com.emls.view.fragments.EmployeeProfile", this)
          this.getView().addDependent(this._oProfileDialog)
        }
        this._oProfileDialog.open()
      },

      onCloseProfile: function () {
        this._oProfileDialog.close()
      },

      // change password

      onChangePassword: function () {
        if (!this._oChangePasswordDialog) {
          this._oChangePasswordDialog = sap.ui.xmlfragment("ChangePasswordDialog", "com.emls.view.fragments.ChangePassword", this);
          this.getView().addDependent(this._oChangePasswordDialog);
        }
        this._oChangePasswordDialog.open();
      },

      onSubmitChangePassword: function () {
        // Ensure fragment exists
        if (!this._oChangePasswordDialog) {
          MessageBox.error("Error: Change Password Dialog not found.");
          return;
        }

        // ✅ Correct way to access fragment controls using Fragment.byId()
        var oCurrentPassword = sap.ui.core.Fragment.byId("ChangePasswordDialog", "currentPassword");
        var oNewPassword = sap.ui.core.Fragment.byId("ChangePasswordDialog", "newPassword");
        var oConfirmPassword = sap.ui.core.Fragment.byId("ChangePasswordDialog", "confirmPassword");

        // Check if inputs were found
        if (!oCurrentPassword || !oNewPassword || !oConfirmPassword) {
          MessageBox.error("Error: Could not find input fields.");
          return;
        }

        // 2. Validate inputs
        if (!oCurrentPassword.getValue() || !oNewPassword.getValue() || !oConfirmPassword.getValue()) {
          MessageBox.error("Please fill in all fields.");
          return;
        }

        if (oNewPassword.getValue() !== oConfirmPassword.getValue()) {
          MessageBox.error("New password and confirm password do not match.");
          return;
        }

        // 3. Get user data
        var oUserData = this.getView().getModel("employee").getData();

        // 4. Call the correct endpoint with proper parameters
        fetch(`http://localhost:3000/employees/${oUserData.id}/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            CurrentPassword: oCurrentPassword.getValue(),
            NewPassword: oNewPassword.getValue()
          }),
        })
          .then(response => {
            if (!response.ok) {
              return response.json().then(err => Promise.reject(err));
            }
            return response.json();
          })
          .then(data => {
            if (data.message === "Password changed successfully") {
              MessageBox.success("Password changed successfully!", {
                onClose: () => {
                  // Clear fields
                  oCurrentPassword.setValue("");
                  oNewPassword.setValue("");
                  oConfirmPassword.setValue("");
                  this._oChangePasswordDialog.close();
                }
              });
            }
          })
          .catch(error => {
            console.error("Password change error:", error);
            const errorMessage = error.error || "Failed to change password. Please try again.";
            MessageBox.error(errorMessage);
          });
      },

      onCancelChangePassword: function () {
        if (this._oChangePasswordDialog) {
          this._oChangePasswordDialog.close();
        }
      },
      //Basic Calender
      _initModels: function () {
        const oModel = new JSONModel({
          leaves: [],
          //currentDate: UI5Date.getDateInstance()
        });
        this.getView().setModel(oModel);
      },
      onOpenCalendar: function () {
        // Simple phase 1 implementation
        if (!this._oCalendarDialog) {
          Fragment.load({
            id: this.getView().getId(),
            name: "com.emls.view.fragments.Calendar",
            controller: this
          }).then(function (oDialog) {
            this.getView().addDependent(oDialog);
            this._oCalendarDialog = oDialog;
            oDialog.open();
          }.bind(this)).catch(function (err) {
            MessageBox.error("Error loading calendar: " + err);
          });
        } else {
          this._oCalendarDialog.open();
        }
      },

      onCloseSimpleCalendar: function () {
        if (this._oCalendarDialog) {
          this._oCalendarDialog.close();
        }
      },

      //open calendar
      onOpenCalendar1: function () {
        if (!this._enhancedCalendarController) {
          this._enhancedCalendarController = new EnhancedCalendar();
        }
        this._enhancedCalendarController.openEnhancedCalendar();
      },

      // Add cleanup
      onExit: function () {
        if (this._enhancedCalendarController) {
          this._enhancedCalendarController.destroy();
        }
      },
      _getEnhancedCalendarController: function () {
        if (!this._oEnhancedCalendarController) {
          this._oEnhancedCalendarController = sap.ui.controller(
            "com.emls.controller.EnhancedCalendar",
            this.getView().getComponent()
          );
        }
        return this._oEnhancedCalendarController;
      },

      onLogOut: function () {
        console.log("Logout requested");

        MessageBox.confirm("Are you sure you want to log out?", {
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
              localStorage.removeItem("userData");
              localStorage.removeItem("userRole");
              localStorage.removeItem("adminData");
              localStorage.removeItem("adminRole");

              clearTimeout(this._sessionTimeout);

              oRouter.navTo("RouteMainView");
            }
          }.bind(this),
        });
      },

      onViewLeaveDetails: function () {
        if (!this._oLeaveDetails) {
          this._oLeaveDetails = sap.ui.xmlfragment("com.emls.view.fragments.LeaveDetails", this);
          this.getView().addDependent(this._oLeaveDetails);
        }

        const oUserData = this.getView().getModel("employee").getData();

        fetch(`http://localhost:3000/leave/${oUserData.id}`)
          .then((response) => response.json())
          .then((data) => {
            // Directly use server data without transformation
            const oLeaveDetails = new JSONModel(data);
            this.getView().setModel(oLeaveDetails, "leaveDetails");
            this._oLeaveDetails.open();
          })
          .catch((error) => {
            console.error("Error:", error);
            MessageBox.error("Failed to fetch leave details. Please try again.");
          });
      },

      onCloseLeaveDetails: function () {
        this._oLeaveDetails.close()
      },

      onOpenApplyLeave: function () {
        if (!this._oApplyLeave) {
          this._oApplyLeave = sap.ui.xmlfragment("com.emls.view.fragments.ApplyLeave", this);
          this.getView().addDependent(this._oApplyLeave);
        }

        var oLeaveApplicationModel = this.getView().getModel("leaveApplication");
        var oLeaveTypesModel = this.getView().getModel("leaveTypes");

        // Get current leave types and add "Other" dynamically
        var aLeaveTypes = oLeaveTypesModel.getData();
        if (!aLeaveTypes.some(type => type.LeaveType === "Other")) {
          aLeaveTypes.push({ LeaveType: "Other" });  // Add "Other" if it's not already present
          oLeaveTypesModel.setData(aLeaveTypes);
        }

        // Reset form fields
        oLeaveApplicationModel.setData({
          LeaveType: "",
          CustomLeaveType: "",
          FromDate: null,
          ToDate: null,
          Description: "",
        });

        this._oApplyLeave.open();
      }
      ,

      // Select custom leave type
      onLeaveTypeChange: function (oEvent) {
        var sSelectedKey = oEvent.getSource().getSelectedKey();
        var oView = this.getView();

        var oCustomLeaveLabel = sap.ui.getCore().byId("customLeaveLabel");
        var oCustomLeaveInput = sap.ui.getCore().byId("customLeaveInput");

        var bShowCustomLeave = (sSelectedKey === "Other");
        oCustomLeaveLabel.setVisible(bShowCustomLeave);
        oCustomLeaveInput.setVisible(bShowCustomLeave);
      },

      onCloseApplyLeave: function () {
        this._oApplyLeave.close()
      },

      onSubmitLeave: function () {

        const oLeaveData = this.getView().getModel("leaveApplication").getData();

        // Date validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);  // Normalize to day start

        const fromDate = new Date(oLeaveData.FromDate);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(oLeaveData.ToDate);
        toDate.setHours(0, 0, 0, 0);

        // Validate dates
        if (fromDate < today) {
          MessageBox.error("From Date cannot be in the past");
          return;
        }

        if (toDate < fromDate) {
          MessageBox.error("To Date cannot be before From Date");
          return;
        }

        var oUserData = this.getView().getModel("employee").getData();

        console.log("Leave Data before submission:", oLeaveData); // Debug log

        // Validate required fields
        if (
          !oLeaveData.LeaveType ||
          (oLeaveData.LeaveType === "Other" && !oLeaveData.CustomLeaveType) ||
          !oLeaveData.FromDate ||
          !oLeaveData.ToDate ||
          !oLeaveData.Description
        ) {
          MessageBox.error("Please fill in all required fields.");
          return;
        }

        // Validate date range
        if (oLeaveData.FromDate > oLeaveData.ToDate) {
          MessageBox.error("From Date must be earlier than or equal to To Date.");
          return;
        }

        // Determine the leave type to be sent
        var leaveType = oLeaveData.LeaveType === "Other" ? oLeaveData.CustomLeaveType : oLeaveData.LeaveType;

        console.log("Final Leave Type to be submitted:", leaveType); // Debug log

        // Convert dates to YYYY-MM-DD format
        const formatDate = (date) => {
          if (!date) return null;
          return new Date(date).toISOString().split('T')[0];
        };

        const leaveRequestData = {
          LeaveType: leaveType,
          FromDate: formatDate(oLeaveData.FromDate),
          ToDate: formatDate(oLeaveData.ToDate),
          Description: oLeaveData.Description,
          empid: oUserData.id
        };

        console.log("Leave Request Data:", leaveRequestData); // Debug log

        // Send the leave request to the server
        fetch("http://localhost:3000/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(leaveRequestData)
        })
          .then(response => response.json())
          .then(data => {
            console.log("Server response:", data); // Debug log
            if (data.message === "Leave request created successfully") {
              MessageBox.success("Leave application submitted successfully.", {
                onClose: function () {
                  this.onCloseApplyLeave();
                  this._loadLeaveStatus();
                }.bind(this)
              });
            } else {
              MessageBox.error(data.message || "Failed to submit leave application. Please try again.");
            }
          })
          .catch(error => {
            console.error("Error submitting leave request:", error);
            MessageBox.error("An error occurred. Please try again.");
          });
      },

      formatDate: (oDate) => {
        try {
          if (!oDate) return "";
          const oDateFormat = DateFormat.getDateInstance({ style: "medium" });

          // Handle both Date objects and ISO strings
          const dateObj = typeof oDate === 'string' ? new Date(oDate) : oDate;

          if (isNaN(dateObj.getTime())) {
            console.error("Invalid date passed to formatter:", oDate);
            return "Invalid Date";
          }

          return oDateFormat.format(dateObj);
        } catch (error) {
          console.error("Date formatting error:", error);
          return "Date Error";
        }
      },
      // Edit and revork 

      onRevokeLeave: function (oEvent) {
        const oContext = oEvent.getSource().getBindingContext("leaveDetails");
        const oLeave = oContext.getObject();

        MessageBox.confirm("Are you sure you want to revoke this leave request?", {
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          onClose: sAction => {
            if (sAction === MessageBox.Action.YES) {
              fetch(`http://localhost:3000/leave/${oLeave.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Status: 4 }) // 4 = Revoked
              })
                .then(() => this._refreshLeaveDetails())
                .catch(error => MessageBox.error("Revoke failed"));
            }
          }
        });
      },
      // Edit leave

      onSaveEdit: function () {
        try {
          // Debug 1: Check if path exists

          const oModel2 = this.getView().getModel("leaveDetails");

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const editedFromDate = new Date(oModel2.FromDate);
          editedFromDate.setHours(0, 0, 0, 0);

          if (editedFromDate < today) {
            MessageBox.error("Cannot edit past leave requests");
            return;
          }

          if (!oModel2) {
            console.error("Save Error: leaveDetails model missing in view");
            console.log("Available models:", this.getView().getModelNames());
            MessageBox.error("Data model error - please reopen leave details");
            return;
          }
          console.log("Saving path:", this._oLeavePath);

          // Debug 2: Check model existence
          const oModel = this.getView().getModel("leaveDetails");
          if (!oModel) {
            console.error("Save Error: leaveDetails model not found");
            MessageBox.error("Data model error - please refresh the page");
            return;
          }

          // Debug 3: Check data retrieval
          const oData = oModel.getProperty(this._oLeavePath);
          if (!oData) {
            console.error("Save Error: No data at path:", this._oLeavePath);
            console.log("Model data:", oModel.getData());
            MessageBox.error("Could not find leave request data");
            return;
          }
          console.log("Edit Data:", JSON.stringify(oData, null, 2));

          // Validate dates
          const parseDate = (dateValue) => {
            // Handle both Date objects and strings
            if (dateValue instanceof Date) {
              if (isNaN(dateValue)) throw new Error("Invalid Date object");
              return dateValue;
            }

            if (typeof dateValue === 'string') {
              if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                throw new Error(`Invalid date string format: ${dateValue}`);
              }
              const parts = dateValue.split('-');
              return new Date(parts[0], parts[1] - 1, parts[2]);
            }

            throw new Error(`Unsupported date type: ${typeof dateValue}`);
          };
          // Debug 4: API call
          console.log("Sending update for ID:", oData.id, "with:", {
            FromDate: oData.FromDate,
            ToDate: oData.ToDate
          });

          fetch(`http://localhost:3000/leave/${oData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              FromDate: oData.FromDate,
              ToDate: oData.ToDate
            })
          })
            .then(response => {
              // Debug 5: Check response status
              console.log("Response status:", response.status);
              if (!response.ok) {
                return response.text().then(text => {
                  throw new Error(`Server error: ${response.status} - ${text}`);
                });
              }
              return response.json();
            })
            .then(() => {
              // Debug 6: Refresh data
              console.log("Update successful, refreshing model...");
              oModel.refresh(true);
              MessageBox.success("Leave dates updated successfully");
              this._oEditDialog.close();
            })
            .catch(error => {
              // Debug 7: Catch errors
              console.error("Update error:", error);
              MessageBox.error(`Update failed: ${error.message}`);
            });

        } catch (error) {
          // Debug 8: Catch sync errors
          console.error("Critical save error:", error);
          MessageBox.error("A critical error occurred. Please check the console.");
        }
      },

      onEditLeave: function (oEvent) {
        try {
          const oContext = oEvent.getSource().getBindingContext("leaveDetails");
          if (!oContext) {
            console.error("Edit Error: No binding context");
            MessageBox.error("Could not find leave request data");
            return;
          }

          this._oLeavePath = oContext.getPath();
          console.log("Edit Path:", this._oLeavePath);

          const oModel = this.getView().getModel("leaveDetails");
          if (!oModel) {
            console.error("Edit Error: leaveDetails model missing");
            return;
          }

          if (!this._oEditDialog) {
            Fragment.load({
              name: "com.emls.view.fragments.EditLeave",
              controller: this
            }).then(oDialog => {
              this._oEditDialog = oDialog;
              this.getView().addDependent(oDialog);
              console.log("Dialog created, binding element...");

              // Debug 9: Verify binding
              oDialog.bindElement({
                path: this._oLeavePath,
                model: "leaveDetails"
              });
              console.log("Binding successful, opening dialog...");
              oDialog.open();
            }).catch(error => {
              console.error("Dialog load error:", error);
            });
          } else {
            console.log("Reusing existing dialog");
            this._oEditDialog.bindElement({
              path: this._oLeavePath,
              model: "leaveDetails"
            });
            this._oEditDialog.open();
          }
        } catch (error) {
          console.error("Edit Error:", error);
          MessageBox.error("Failed to open editor");
        }
      },

      onDatePickerChange: function (oEvent) {
        const datePicker = oEvent.getSource();
        const binding = datePicker.getBinding("value");

        // Force format update
        if (binding && binding.getValue()) {
          const sValue = binding.getExternalValue();
          datePicker.setValue(sValue);
        }
      },

      formatDisplayDate: function (dateString) {
        if (!dateString) return "";
        try {
          // Handle pure date strings (YYYY-MM-DD)
          const dateObj = new Date(dateString);
          return DateFormat.getDateInstance({ style: "medium" }).format(dateObj);
        } catch (e) {
          console.error("Date format error:", dateString, e);
          return "Invalid Date";
        }
      },
      // Get minimum date for DatePicker
      getMinDate: function () {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
      },

      // Handle date changes
      onDateChange: function (oEvent) {
        const datePicker = oEvent.getSource();
        const date = datePicker.getDateValue();

        // Clear if invalid
        if (isNaN(date.getTime())) {
          datePicker.setValue("");
          MessageBox.error("Please select a valid date");
        }
      },
      onCancelEdit: function () {
        this._oEditDialog.close();
      },

      _refreshLeaveDetails: function () {
        const oUserData = this.getView().getModel("employee").getData();
        fetch(`http://localhost:3000/leave/${oUserData.id}`)
          .then(response => response.json())
          .then(data => {
            // Normalize dates
            const normalized = data.map(item => ({
              ...item,
              FromDate: item.FromDate.split('T')[0],
              ToDate: item.ToDate.split('T')[0]
            }));
            this.getView().getModel("leaveDetails").setData(normalized);
          });
      },

      // Add to controller formatters
      isActionAllowed: function (sCreatedDate) {
        if (!sCreatedDate) return false;
        try {
          // Extract date part from ISO string
          const datePart = sCreatedDate.split('T')[0];
          const oCreatedDate = new Date(datePart);
          const oNow = new Date();
          oNow.setHours(0, 0, 0, 0);
          return (oNow - oCreatedDate) <= 172800000; // 2 days in milliseconds
        } catch (e) {
          console.error("Date error:", e);
          return false;
        }
      },
      isRevokeVisible: function (iStatus, sCreatedDate) {
        return iStatus === 0 && this.isActionAllowed(sCreatedDate);
      },

      formatters: {
        isActionAllowed: function (sCreatedDate) {
          console.log("CreatedDate value:", sCreatedDate);
          if (!sCreatedDate) return false;
          const oNow = new Date();
          const oCreatedDate = new Date(sCreatedDate);
          const iDiffHours = Math.abs(oNow - oCreatedDate) / 36e5; // Hours difference
          return iDiffHours <= 48; // 48 hours = 2 days
        }
      },
    }),
)