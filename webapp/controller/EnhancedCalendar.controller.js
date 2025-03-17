sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/m/MessageBox",
      "sap/ui/core/Fragment",
      "sap/ui/core/format/DateFormat",
      "sap/ui/unified/DateTypeRange",
      "sap/ui/core/date/UI5Date"
    ],
    function(Controller, JSONModel, MessageBox, Fragment, DateFormat, DateTypeRange, UI5Date) {
      "use strict";
  
      return Controller.extend("com.emls.controller.EnhancedCalendar", {
        onInit: function() {
          this._initializeModels();
          this._loadLeaveData();
        },
  
        _initializeModels: function() {
          // Main calendar model
          const oCalendarModel = new JSONModel({
            currentDate: UI5Date.getInstance(),
            activeLeave: null,
            activeLeaveStartFormatted: "",
            activeLeaveEndFormatted: "",
            daysRemaining: 0
          });
          this.getView().setModel(oCalendarModel);
  
          // Leave balance model
          const oLeaveBalanceModel = new JSONModel({
            totalDays: 30,
            remainingDays: 30
          });
          this.getView().setModel(oLeaveBalanceModel, "leaveBalance");
        },
        onOpenEnhancedCalendar: function() {
            if (!this._oDialog) {
              Fragment.load({
                id: this.getView().getId(),
                name: "com.emls.view.fragments.EnhancedCalendar",
                controller: this
              }).then(function(oDialog) {
                this.getView().addDependent(oDialog);
                this._oDialog = oDialog;
                this._loadLeaveData();
                oDialog.open();
              }.bind(this));
            } else {
              this._loadLeaveData().then(function() {
                this._oDialog.open();
              }.bind(this));
            }
          },
  
        _loadLeaveData: function() {
          const oUserData = this.getOwnerComponent().getModel("userData").getData();
          
          return fetch(`http://localhost:3000/leave/employee/${oUserData.id}`)
            .then(response => {
              if (!response.ok) throw new Error("Network response was not ok");
              return response.json();
            })
            .then(data => this._processLeaveData(data))
            .catch(error => {
              console.error("Error loading leave data:", error);
              MessageBox.error("Failed to load leave data");
              throw error;
            });
        },
  
        _processLeaveData: function(aLeaveData) {
          const oCalendar = this.byId("enhancedLeaveCalendar");
          oCalendar.destroySpecialDates();
          
          // Add current date marker
          oCalendar.addSpecialDate(
            new DateTypeRange({
              startDate: UI5Date.getInstance(),
              type: "Type06",
              tooltip: "Current Date"
            })
          );
  
          aLeaveData.forEach(oLeave => {
            const oStartDate = new Date(oLeave.FromDate);
            const oEndDate = new Date(oLeave.ToDate);
            
            // Main leave period
            oCalendar.addSpecialDate(
              new DateTypeRange({
                startDate: oStartDate,
                endDate: oEndDate,
                type: this._getLeaveType(oLeave.Status),
                tooltip: this._getLeaveTooltip(oLeave)
              })
            );
  
            // Add start/end markers
            oCalendar.addSpecialDate(
              new DateTypeRange({
                startDate: oStartDate,
                type: "Type07",
                tooltip: "Leave Start Date"
              })
            );
            oCalendar.addSpecialDate(
              new DateTypeRange({
                startDate: oEndDate,
                type: "Type08",
                tooltip: "Leave End Date"
              })
            );
          });
        },
  
        _getLeaveType: function(iStatus) {
          const mTypes = {
            0: "Type04",  // New - Gray
            1: "Type01",  // Approved - Green
            2: "Type02",  // Pending - Yellow
            3: "Type03"   // Rejected - Red
          };
          return mTypes[iStatus] || "Type04";
        },
  
        _getLeaveTooltip: function(oLeave) {
          const oDateFormat = DateFormat.getDateInstance({ style: "medium" });
          return `Leave Type: ${oLeave.LeaveType}
            \nStatus: ${this.formatLeaveStatusText(oLeave.Status)}
            \nFrom: ${oDateFormat.format(new Date(oLeave.FromDate))}
            \nTo: ${oDateFormat.format(new Date(oLeave.ToDate))}`;
        },
  
        onCalendarSelect: function(oEvent) {
          const oSelectedDate = oEvent.getParameter("date");
          const aLeaves = this.getView().getModel("userData").getProperty("/leaves");
          
          const oLeave = aLeaves.find(oLeave => {
            const oStart = new Date(oLeave.FromDate);
            const oEnd = new Date(oLeave.ToDate);
            return oSelectedDate >= oStart && oSelectedDate <= oEnd;
          });
  
          if (oLeave) {
            MessageBox.information(
              `Leave Details:\n\nType: ${oLeave.LeaveType}\nStatus: ${this.formatLeaveStatusText(oLeave.Status)}`,
              { title: "Leave Information" }
            );
          }
        },
  
        formatLeaveStatusText: function(iStatus) {
          const mStatus = {
            0: "New",
            1: "Approved",
            2: "Pending",
            3: "Rejected"
          };
          return mStatus[iStatus] || "Unknown";
        },
        exit: function() {
            if (this._oDialog) {
              this._oDialog.destroy();
            }
          },
  
        onCloseEnhancedCalendar: function() {
          this._oDialog.then(function(oDialog) {
            oDialog.close();
          });
        }
      });
    }
  );