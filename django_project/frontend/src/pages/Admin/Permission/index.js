/**
 * GeoSight is UNICEF's geospatial web-based business intelligence platform.
 *
 * Contact : geosight-no-reply@unicef.org
 *
 * .. note:: This program is free software; you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation; either version 3 of the License, or
 *     (at your option) any later version.
 *
 * __author__ = 'irwan@kartoza.com'
 * __date__ = '13/06/2023'
 * __copyright__ = ('Copyright 2023, Unicef')
 */

import React, { Fragment, useEffect, useState } from 'react';

import ShareIcon from '@mui/icons-material/Share';
import CircularProgress from '@mui/material/CircularProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DoDisturbOnIcon from '@mui/icons-material/DoDisturbOn';
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";

import Modal, {
  ModalContent,
  ModalFooter,
  ModalHeader
} from "../../../components/Modal";
import {
  AddButton,
  DeleteButton,
  EditButton,
  SaveButton
} from "../../../components/Elements/Button";
import { fetchJSON } from "../../../Requests";
import { dictDeepCopy } from "../../../utils/main";

import './style.scss';
import $ from "jquery";
import { IconTextField } from "../../../components/Elements/Input";
import SearchIcon from "@mui/icons-material/Search";
import { USER_COLUMNS } from "../ModalSelector/User";

/**
 * Permission Configuration Form Table data selection
 * @param {str} dataUrl Url for data.
 * @param {str} permissionLabel permission label.
 * @param {Array} permissionChoices permission choices.
 * @param {Array} columns Columns data.
 * @param {boolean} open Is modal opened.
 * @param {Function} setOpen Function of set open.
 * @param {Dict} permissionData Selected data.
 * @param {Function} setPermissionData Set permission data.
 * @param {string} permissionDataListKey The key for the data.
 * */
export function PermissionFormTableDataSelection(
  {
    dataUrl,
    permissionLabel,
    permissionChoices,
    open,
    setOpen,
    columns,
    permissionData,
    setPermissionData,
    permissionDataListKey
  }
) {
  const selectedData = permissionData[permissionDataListKey]
  const [permissionChoice, setPermissionChoice] = useState(permissionChoices[0][0])
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [selectionModel, setSelectionModel] = useState([]);
  const [search, setSearch] = useState(null);

  /** Search on change */
  const searchOnChange = (evt) => {
    setSearch(evt.target.value.toLowerCase())
  }

  const selectedIds = selectedData.map(data => {
    return data.id
  })
  let unselectedData = []
  if (data) {
    unselectedData = data.filter(data => {
      return !selectedIds.includes(data.id)
    })
  }

  /** Fetch data when modal is opened **/
  useEffect(() => {
    if (open && !loaded) {
      setLoaded(true)
      fetchJSON(dataUrl)
        .then(data => {
          setData(data)
        })
    }
  }, [open])

  /** Filter by search input */
  const fields = columns.map(column => column.field).filter(column => column !== 'id')
  let rows = unselectedData;
  if (search) {
    rows = rows.filter(row => {
      let found = false
      fields.map(field => {
        if (row[field].toLowerCase().includes(search)) {
          found = true;
        }
      })
      return found
    })
  }

  return <Modal
    className='PermissionFormModal'
    open={open}
    onClosed={() => {
      setOpen(false)
    }}
  >
    <ModalHeader onClosed={() => {
      setOpen(false)
    }}>
      List of {permissionLabel}
    </ModalHeader>
    <div className='AdminContent'>
      <div className='BasicForm'>
        <div className="BasicFormSection">
          <div>
            <label className="form-label">Permission</label>
          </div>
          <div>
            <FormControl className='BasicForm'>
              <Select
                value={permissionChoice}
                onChange={(evt) => {
                  setPermissionChoice(evt.target.value)
                }}
              >
                {
                  permissionChoices.map(choice => {
                    return <MenuItem
                      key={choice[0]}
                      value={choice[0]}>{choice[1]}</MenuItem>
                  })
                }
              </Select>
            </FormControl>
          </div>
        </div>
      </div>
      <div className='AdminBaseInput Indicator-Search'>
        <IconTextField
          placeholder={"Search " + permissionLabel}
          iconStart={<SearchIcon/>}
          onChange={searchOnChange}
          value={search ? search : ""}
        />
      </div>
      {
        !data ?
          <div style={{ textAlign: "center" }}>
            <CircularProgress/>
          </div> :
          <div style={{ height: '400px' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={20}
              rowsPerPageOptions={[20]}
              initialState={{
                sorting: {
                  sortModel: [{ field: 'username', sort: 'asc' }],
                },
              }}
              disableSelectionOnClick

              checkboxSelection={true}
              onSelectionModelChange={(newSelectionModel) => {
                setSelectionModel(newSelectionModel);
              }}
              selectionModel={selectionModel}
            />
          </div>
      }
      <div className='Save-Button'>
        <SaveButton
          variant="secondary"
          text={"Add " + permissionLabel + 's'}
          onClick={() => {
            const newData = data.filter(row => {
              const selected = selectionModel.includes(row.id)
              if (selected) {
                row.permission = permissionChoice
              }
              return selected
            })
            permissionData[permissionDataListKey] = permissionData[permissionDataListKey].concat(newData)
            setPermissionData({ ...permissionData })
            setOpen(false)
          }}
        />
      </div>
    </div>
  </Modal>
}

/**
 * Update permission modal
 */
export function UpdatePermissionModal(
  { choices, open, setOpen, selectedPermission }
) {
  const [selected, setSelected] = useState(choices[0][0])

  return <Modal
    className='PermissionFormModal'
    open={open}
    onClosed={() => {
      setOpen(false)
    }}
  >
    <ModalHeader onClosed={() => {
      setOpen(false)
    }}>Update permission</ModalHeader>
    <ModalContent>
      <FormControl className='BasicForm'>
        <Select
          value={selected}
          onChange={(evt) => {
            setSelected(evt.target.value)
          }}
        >
          {
            choices.map(choice => {
              return <MenuItem
                key={choice[0]}
                value={choice[0]}>{choice[1]}</MenuItem>
            })
          }
        </Select>
      </FormControl>
    </ModalContent>
    <ModalFooter>
      <div className='Save-Button'>
        <SaveButton
          variant="secondary"
          text={"Apply Changes"}
          onClick={() => {
            selectedPermission(selected)
          }}
        />
      </div>
    </ModalFooter>
  </Modal>
}

/**
 * Permission Configuration Form Table
 * @param {str} permissionLabel permissionLabel.
 * @param {Array} columns Columns data.
 * @param {dict} data Permission data.
 * @param {string} dataListKey Permission data list.
 * @param {Function} setData Function of set data.
 * @param {List} permissionChoices Permission choice.
 * @param {string} dataUrl Data URL.
 * */
export function PermissionFormTable(
  {
    permissionLabel, columns,
    data, dataListKey,
    setData, permissionChoices,
    dataUrl
  }
) {
  const [open, setOpen] = useState(false)
  const [openPermission, setOpenPermission] = useState(false)
  const [selectionModel, setSelectionModel] = useState([]);
  const dataList = data[dataListKey]

  return <div>
    <div className='PermissionFormTableHeader'>
      <DeleteButton
        disabled={!selectionModel.length}
        variant="secondary Reverse"
        text={"Delete"}
        onClick={() => {
          if (confirm(`Do you want to delete the selected ${permissionLabel.toLowerCase()}s?`) === true) {
            data[dataListKey] = dataList.filter(row => !selectionModel.includes(row.id))
            setData({ ...data })
            setSelectionModel([])
          }
        }}
      />
      <EditButton
        disabled={!selectionModel.length}
        variant="secondary Reverse"
        text={"Change permission"}
        onClick={() => {
          setOpenPermission(true)
        }}
      />
      <AddButton
        variant="secondary"
        text={"Share to new " + permissionLabel.toLowerCase() + "(s)"}
        onClick={() => {
          setOpen(true)
        }}
      />
    </div>
    <div className='PermissionFormTable MuiDataGridTable'>
      <DataGrid
        rows={dataList}
        isRowSelectable={(params) => !params.row.creator}
        columns={columns.concat([
          {
            field: 'permission', headerName: 'Permission', flex: 1,
            renderCell: (params) => {
              return <FormControl className='BasicForm'>
                <Select
                  disabled={params.row.creator}
                  value={params.row.permission}
                  onChange={(evt) => {
                    params.row.permission = evt.target.value
                    setData({ ...data })
                  }}
                >
                  {
                    permissionChoices.map(choice => {
                      return <MenuItem
                        key={choice[0]}
                        value={choice[0]}>{choice[1]}</MenuItem>
                    })
                  }
                </Select>
              </FormControl>
            }
          },
          {
            field: 'actions',
            type: 'actions',
            width: 80,
            getActions: (params) => {
              if (params.row.creator) {
                return []
              }
              return [
                <GridActionsCellItem
                  icon={
                    <DoDisturbOnIcon
                      className='DeleteButton'/>
                  }
                  onClick={() => {
                    if (confirm(`Do you want to remove this ${permissionLabel.toLowerCase()}?`) === true) {
                      data[dataListKey] = dataList.filter(row => {
                        return row.id !== params.row.id
                      })
                      setData({ ...data })
                    }
                  }}
                  label="Delete"
                />
              ]
            },
          }
        ])
        }
        pageSize={20}
        rowsPerPageOptions={[20]}
        initialState={{
          sorting: {
            sortModel: [{ field: 'username', sort: 'asc' }],
          },
        }}
        disableSelectionOnClick
        checkboxSelection
        onSelectionModelChange={(newSelectionModel) => {
          setSelectionModel(newSelectionModel);
        }}
        selectionModel={selectionModel}
      />
      <PermissionFormTableDataSelection
        permissionLabel={permissionLabel}
        permissionChoices={permissionChoices}
        columns={columns}
        open={open}
        setOpen={setOpen}
        dataUrl={dataUrl}
        permissionData={data}
        setPermissionData={setData}
        permissionDataListKey={dataListKey}
      />
    </div>
    <UpdatePermissionModal
      choices={permissionChoices} open={openPermission}
      setOpen={setOpenPermission}
      selectedData={dataList.filter(data => selectionModel.includes(data.id))}
      selectedPermission={(permission) => {
        dataList.map(row => {
          if (selectionModel.includes(row.id)) {
            row.permission = permission
          }
        })
        data[dataListKey] = dataList
        setData({ ...data })
        setOpenPermission(false)
        setSelectionModel([])
      }}
    />
  </div>
}

/**
 * Permission Configuration Form.
 * Can be used without using modal.
 * @param {dict} data Permission data.
 * @param {Function} setData Function of set data.
 * @param {dict} additionalTabs Other tabs.
 * */
export function PermissionForm({ data, setData, additionalTabs = {} }) {
  const [tab, setTab] = useState('UserAccess')
  return <Fragment>
    {
      !data ?
        <div style={{ textAlign: "center" }}>
          <CircularProgress/>
        </div> :
        <div className={'PermissionForm BasicForm ' + tab}>
          <div className='TabPrimary'>
            <div className={tab === 'UserAccess' ? 'Selected' : ''}
                 onClick={() => setTab('UserAccess')}>
              User Access ({data.user_permissions.length})
            </div>
            <div className={tab === 'GroupAccess' ? 'Selected' : ''}
                 onClick={() => setTab('GroupAccess')}>
              Group Access ({data.group_permissions.length})
            </div>
            <div className={tab === 'GeneralAccess' ? 'Selected' : ''}
                 onClick={() => setTab('GeneralAccess')}>
              General Access
            </div>
            {
              Object.keys(additionalTabs).map(key => {
                return <div
                  key={key}
                  className={tab === key ? 'Selected' : ''}
                  onClick={() => setTab(key)}>
                  {key}
                </div>
              })
            }
          </div>
          {/* USERS ACCESS */}
          {
            tab === "UserAccess" ?
              <div className="UserAccess">
                <PermissionFormTable
                  permissionLabel='User'
                  columns={USER_COLUMNS}
                  data={data}
                  dataListKey='user_permissions'
                  setData={setData}
                  permissionChoices={data.choices.user_permission}
                  dataUrl={urls.api.users + '?role__in=Contributor,Creator,Super%20Admin'}
                />
              </div> : null
          }

          {/* GROUP ACCESS */}
          {
            tab === "GroupAccess" ?
              <div className="GroupAccess">
                <PermissionFormTable
                  permissionLabel='Group'
                  columns={[
                    { field: 'id', headerName: 'id', hide: true },
                    { field: 'name', headerName: 'Group name', flex: 1 },
                  ]}
                  data={data}
                  dataListKey='group_permissions'
                  setData={setData}
                  permissionChoices={data.choices.group_permission}
                  dataUrl={urls.api.groups}
                />
              </div> : ""
          }

          {/* ORGANIZATION ACCESS */}
          {
            tab === "GeneralAccess" ?
              <div className='GeneralAccess'>

                {/* We don't use organization anymore */}
                {/*<div className="BasicFormSection">*/}
                {/*  <div>*/}
                {/*    <label className="form-label">*/}
                {/*      Organization Access*/}
                {/*    </label>*/}
                {/*  </div>*/}
                {/*  <FormControl>*/}
                {/*    <RadioGroup*/}
                {/*      value={data.organization_permission}*/}
                {/*      name="radio-buttons-group"*/}
                {/*      onChange={(evt) => {*/}
                {/*        data.organization_permission = evt.target.value*/}
                {/*        setData({ ...data })*/}
                {/*      }}*/}
                {/*    >*/}
                {/*      {*/}
                {/*        data.choices.organization_permission.map(choice => {*/}
                {/*          return <FormControlLabel*/}
                {/*            key={choice[0]}*/}
                {/*            value={choice[0]} control={<Radio/>}*/}
                {/*            label={choice[1]}/>*/}
                {/*        })*/}
                {/*      }*/}
                {/*    </RadioGroup>*/}
                {/*  </FormControl>*/}
                {/*</div>*/}

                {/* PUBLIC ACCESS */}
                <div className="BasicFormSection">
                  <div>
                    <label className="form-label">Public Access</label>
                  </div>
                  <FormControl>
                    <RadioGroup
                      value={data.public_permission}
                      name="radio-buttons-group"
                      onChange={(evt) => {
                        data.public_permission = evt.target.value
                        setData({ ...data })
                      }}
                    >
                      {
                        data.choices.public_permission.map(choice => {
                          return <FormControlLabel
                            key={choice[0]}
                            value={choice[0]} control={<Radio/>}
                            label={choice[1]}/>
                        })
                      }
                    </RadioGroup>
                  </FormControl>
                </div>
              </div> : null
          }

          {/* OTHER TABS */}
          {
            Object.keys(additionalTabs).map(key => {
              if (tab === key) {
                return additionalTabs[key]
              }
              return null
            })
          }
        </div>
    }
  </Fragment>
}

/**
 * Permission Configuration
 * @param {string} name Name of data that will be updated.
 * @param {string} urlData Url to fetch data.
 * @param {dict} additionalTabs Other tabs.
 * */
export default function PermissionModal(
  { name, urlData, additionalTabs = {} }
) {
  const [open, setOpen] = useState(false)
  const [defaultData, setDefaultData] = useState(null)
  const [data, setData] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  /** Fetch data when modal is opened **/
  useEffect(() => {
    setUploaded(false)
    if (open) {
      if (!loaded) {
        setLoaded(true)
        fetchJSON(urlData)
          .then(data => {
            setDefaultData(data)
          })
      } else {
        setData(dictDeepCopy(defaultData))
      }
    }
  }, [open])

  /** Fetch data when modal is opened **/
  useEffect(() => {
    setData(dictDeepCopy(defaultData))
  }, [defaultData])

  return <Fragment>
    <ShareIcon onClick={() => setOpen(true)}/>
    <Modal
      className='PermissionFormModal'
      open={open}
      onClosed={() => {
        setOpen(false)
      }}
    >
      <ModalHeader onClosed={() => {
        setOpen(false)
      }}>
        {
          data ? "Share '" + name + "'" : 'Loading'
        }
      </ModalHeader>
      <ModalContent>
        <PermissionForm
          data={data} setData={setData} additionalTabs={additionalTabs}/>
      </ModalContent>
      <ModalFooter>
        <div className='Save-Button'>
          <SaveButton
            disabled={uploaded}
            variant="secondary"
            text={"Apply Changes"}
            onClick={() => {
              setUploaded(true)
              $.ajax({
                url: urlData,
                data: {
                  data: JSON.stringify(data)
                },
                dataType: 'json',
                type: 'POST',
                success: function () {
                  setDefaultData(data)
                  setOpen(false)
                },
                error: function (error, textStatus, request) {
                },
                beforeSend: beforeAjaxSend
              });
            }}
          />
        </div>
      </ModalFooter>
    </Modal>
  </Fragment>
}