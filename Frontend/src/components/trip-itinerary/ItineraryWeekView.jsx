import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import '../../css/components/itinerary-week-view.css'
import {
  getItineraryCategoryKey,
  ITINERARY_CATEGORIES,
  ITINERARY_HOUR_HEIGHT,
  ITINERARY_HOURS_PER_DAY,
  ITINERARY_START_HOUR,
} from '../../services/itinerary/itineraryConstants'
import {
  formatTime,
  parseTimeToMinutes,
} from '../../services/itinerary/itineraryDateTimeUtils'
import ItineraryItemActions from './ItineraryItemActions'

const HOURS = Array.from(
  {
    length:
      ITINERARY_HOURS_PER_DAY,
  },
  (_, hour) => hour,
)

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getItemTimeRange(item) {
  if (
    !item.startTime ||
    !item.endTime
  ) {
    return null
  }

  const startMinutes =
    parseTimeToMinutes(
      item.startTime,
    )

  const endMinutes =
    parseTimeToMinutes(
      item.endTime,
    )

  if (
    startMinutes === null ||
    endMinutes === null ||
    endMinutes <= startMinutes
  ) {
    return null
  }

  return {
    startMinutes,
    endMinutes,
  }
}

function layoutOverlappingGroup(
  items,
) {
  const laneEndTimes = []

  const laidOutItems =
    items.map((item) => {
      const {
        startMinutes,
        endMinutes,
      } = item.timeRange

      let laneIndex =
        laneEndTimes.findIndex(
          (laneEndTime) =>
            laneEndTime <=
            startMinutes,
        )

      if (laneIndex === -1) {
        laneIndex =
          laneEndTimes.length

        laneEndTimes.push(
          endMinutes,
        )
      } else {
        laneEndTimes[laneIndex] =
          endMinutes
      }

      return {
        ...item,
        laneIndex,
      }
    })

  const laneCount =
    Math.max(
      1,
      laneEndTimes.length,
    )

  return laidOutItems.map(
    (item) => ({
      ...item,
      laneCount,
    }),
  )
}

function layoutDayItems(items) {
  const scheduledItems = items
    .map((item) => ({
      ...item,
      timeRange:
        getItemTimeRange(item),
    }))
    .filter(
      (item) =>
        item.timeRange !== null,
    )
    .sort(
      (
        firstItem,
        secondItem,
      ) =>
        firstItem.timeRange
          .startMinutes -
        secondItem.timeRange
          .startMinutes,
    )

  if (
    scheduledItems.length === 0
  ) {
    return []
  }

  const result = []

  let currentGroup = []
  let currentGroupEnd = -1

  const flushCurrentGroup =
    () => {
      if (
        currentGroup.length === 0
      ) {
        return
      }

      result.push(
        ...layoutOverlappingGroup(
          currentGroup,
        ),
      )

      currentGroup = []
      currentGroupEnd = -1
    }

  scheduledItems.forEach(
    (item) => {
      const {
        startMinutes,
        endMinutes,
      } = item.timeRange

      if (
        currentGroup.length > 0 &&
        startMinutes >=
          currentGroupEnd
      ) {
        flushCurrentGroup()
      }

      currentGroup.push(item)

      currentGroupEnd =
        Math.max(
          currentGroupEnd,
          endMinutes,
        )
    },
  )

  flushCurrentGroup()

  return result
}

function ItineraryDeleteConfirmation({
  item,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}) {
  const hasLinkedExpense =
    Boolean(
      item.expenseId,
    ) ||
    Number(item.cost) > 0

  const handleCancel = (
    event,
  ) => {
    event.stopPropagation()

    onCancel()
  }

  const handleConfirm = (
    event,
  ) => {
    event.stopPropagation()

    onConfirm()
  }

  return (
    <div
      className="itinerary-week__delete-confirmation"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <p className="itinerary-week__delete-message">
        Delete this activity?
      </p>

      {hasLinkedExpense && (
        <p className="itinerary-week__delete-warning">
          Its linked expense will
          also be deleted.
        </p>
      )}

      {error && (
        <p
          className="itinerary-week__delete-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="itinerary-week__delete-actions">
        <button
          className="itinerary-week__delete-cancel"
          type="button"
          onClick={
            handleCancel
          }
          disabled={
            isDeleting
          }
        >
          Cancel
        </button>

        <button
          className="itinerary-week__delete-confirm"
          type="button"
          onClick={
            handleConfirm
          }
          disabled={
            isDeleting
          }
        >
          {isDeleting
            ? 'Deleting...'
            : 'Delete'}
        </button>
      </div>
    </div>
  )
}

function ItineraryEventCard({
  item,
  isSelected,
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onToggleSelected,
  onEdit,
  onMoveToPlanLater,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const {
    startMinutes,
    endMinutes,
  } = item.timeRange

  const top =
    (
      startMinutes /
      60
    ) *
    ITINERARY_HOUR_HEIGHT

  const durationMinutes =
    endMinutes -
    startMinutes

  const height =
    Math.max(
      (
        durationMinutes /
        60
      ) *
        ITINERARY_HOUR_HEIGHT,
      34,
    )

  const laneCount =
    item.laneCount ?? 1

  const laneIndex =
    item.laneIndex ?? 0

  const widthPercentage =
    100 / laneCount

  const leftPercentage =
    widthPercentage *
    laneIndex

  const categoryKey =
    getItineraryCategoryKey(
      item.category,
    )

  const handleDoubleClick =
    (event) => {
      event.stopPropagation()

      onToggleSelected(
        item.id,
      )
    }

  const handleKeyDown =
    (event) => {
      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      onToggleSelected(
        item.id,
      )
    }

  return (
    <article
      className={
        isSelected
          ? `itinerary-week__event itinerary-week__event--${categoryKey} itinerary-week__event--selected`
          : `itinerary-week__event itinerary-week__event--${categoryKey}`
      }
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPercentage}% + 4px)`,
        width: `calc(${widthPercentage}% - 8px)`,
      }}
      tabIndex={0}
      aria-label={`${item.title}, ${formatTime(
        item.startTime,
      )} to ${formatTime(
        item.endTime,
      )}. Double click for actions.`}
      onClick={(event) =>
        event.stopPropagation()
      }
      onDoubleClick={
        handleDoubleClick
      }
      onKeyDown={
        handleKeyDown
      }
    >
      <span className="itinerary-week__event-time">
        {formatTime(
          item.startTime,
        )}
        {' – '}
        {formatTime(
          item.endTime,
        )}
      </span>

      <strong className="itinerary-week__event-title">
        {item.title}
      </strong>

      {isSelected &&
        (
          isConfirmingDelete
            ? (
                <ItineraryDeleteConfirmation
                  item={
                    item
                  }
                  isDeleting={
                    isDeleting
                  }
                  error={
                    deleteError
                  }
                  onCancel={
                    onCancelDelete
                  }
                  onConfirm={() =>
                    onConfirmDelete(
                      item,
                    )
                  }
                />
              )
            : (
                <ItineraryItemActions
                  onEdit={() =>
                    onEdit?.(
                      item,
                    )
                  }
                  onMoveToPlanLater={() =>
                    onMoveToPlanLater?.(
                      item,
                    )
                  }
                  onDelete={() =>
                    onStartDelete(
                      item,
                    )
                  }
                />
              )
        )}
    </article>
  )
}

function UnscheduledItemCard({
  item,
  isSelected,
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onToggleSelected,
  onEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const categoryKey =
    getItineraryCategoryKey(
      item.category,
    )

  const handleDoubleClick =
    (event) => {
      event.stopPropagation()

      onToggleSelected(
        item.id,
      )
    }

  const handleKeyDown =
    (event) => {
      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      onToggleSelected(
        item.id,
      )
    }

  return (
    <article
      className={
        isSelected
          ? `itinerary-week__unscheduled-card itinerary-week__unscheduled-card--${categoryKey} itinerary-week__unscheduled-card--selected`
          : `itinerary-week__unscheduled-card itinerary-week__unscheduled-card--${categoryKey}`
      }
      tabIndex={0}
      aria-label={`${item.title}. Double click for actions.`}
      onClick={(event) =>
        event.stopPropagation()
      }
      onDoubleClick={
        handleDoubleClick
      }
      onKeyDown={
        handleKeyDown
      }
    >
      <span className="itinerary-week__unscheduled-date">
        Plan later
      </span>

      <strong>
        {item.title}
      </strong>

      {isSelected &&
        (
          isConfirmingDelete
            ? (
                <ItineraryDeleteConfirmation
                  item={
                    item
                  }
                  isDeleting={
                    isDeleting
                  }
                  error={
                    deleteError
                  }
                  onCancel={
                    onCancelDelete
                  }
                  onConfirm={() =>
                    onConfirmDelete(
                      item,
                    )
                  }
                />
              )
            : (
                <ItineraryItemActions
                  onEdit={() =>
                    onEdit?.(
                      item,
                    )
                  }
                  onDelete={() =>
                    onStartDelete(
                      item,
                    )
                  }
                />
              )
        )}
    </article>
  )
}

function ItineraryWeekView({
  title,
  dateRange,
  days,
  itineraryItems,
  canGoPrevious,
  canGoNext,
  onPreviousWeek,
  onNextWeek,
  onEditItem,
  onMoveItemToPlanLater,
  onDeleteItem,
  isDeletingItem,
  actionError,
}) {
  const calendarScrollRef =
    useRef(null)

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState(null)

  const [
    deleteConfirmationItemId,
    setDeleteConfirmationItemId,
  ] = useState(null)

  const [
    hasDeleteAttempted,
    setHasDeleteAttempted,
  ] = useState(false)

  useEffect(() => {
    const calendar =
      calendarScrollRef.current

    if (!calendar) {
      return
    }

    calendar.scrollTop =
      Math.max(
        0,
        (
          ITINERARY_START_HOUR *
          ITINERARY_HOUR_HEIGHT
        ) - 16,
      )

    calendar.scrollLeft = 0

    setSelectedItemId(null)

    setDeleteConfirmationItemId(
      null,
    )

    setHasDeleteAttempted(false)
  }, [days])

  useEffect(() => {
    const handleDocumentClick =
      () => {
        if (
          isDeletingItem
        ) {
          return
        }

        setSelectedItemId(null)

        setDeleteConfirmationItemId(
          null,
        )

        setHasDeleteAttempted(false)
      }

    document.addEventListener(
      'click',
      handleDocumentClick,
    )

    return () => {
      document.removeEventListener(
        'click',
        handleDocumentClick,
      )
    }
  }, [
    isDeletingItem,
  ])

  const visibleDateValues =
    useMemo(
      () =>
        new Set(
          days.map(
            (day) =>
              day.dateValue,
          ),
        ),
      [days],
    )

  const itemsByDate =
    useMemo(() => {
      const result =
        new Map()

      days.forEach(
        (day) => {
          result.set(
            day.dateValue,
            [],
          )
        },
      )

      itineraryItems.forEach(
        (item) => {
          if (
            !visibleDateValues.has(
              item.itineraryDate,
            )
          ) {
            return
          }

          result
            .get(
              item.itineraryDate,
            )
            .push(item)
        },
      )

      return result
    }, [
      days,
      itineraryItems,
      visibleDateValues,
    ])

  const unscheduledItems =
    useMemo(
      () =>
        itineraryItems.filter(
          (item) =>
            !item.startTime &&
            !item.endTime &&
            (
              !item.itineraryDate ||
              visibleDateValues.has(
                item.itineraryDate,
              )
            ),
        ),
      [
        itineraryItems,
        visibleDateValues,
      ],
    )

  const handleToggleSelected =
    (itemId) => {
      if (
        isDeletingItem
      ) {
        return
      }

      setSelectedItemId(
        (currentItemId) =>
          currentItemId ===
          itemId
            ? null
            : itemId,
      )

      setDeleteConfirmationItemId(
        null,
      )

      setHasDeleteAttempted(false)
    }

  const handleStartDeleting =
    (item) => {
      if (
        !item?.id ||
        isDeletingItem
      ) {
        return
      }

      setSelectedItemId(
        item.id,
      )

      setDeleteConfirmationItemId(
        item.id,
      )

      setHasDeleteAttempted(false)
    }

  const handleCancelDeleting =
    () => {
      if (
        isDeletingItem
      ) {
        return
      }

      setDeleteConfirmationItemId(
        null,
      )

      setHasDeleteAttempted(false)
    }

  const handleConfirmDeleting =
    async (item) => {
      if (
        !item?.id ||
        isDeletingItem
      ) {
        return
      }

      setHasDeleteAttempted(
        true,
      )

      const wasDeleted =
        await onDeleteItem?.(
          item,
        )

      if (!wasDeleted) {
        return
      }

      setDeleteConfirmationItemId(
        null,
      )

      setSelectedItemId(null)

      setHasDeleteAttempted(false)
    }

  return (
    <section className="itinerary-week">
      <div className="itinerary-week__heading-layout">
        <div className="itinerary-week__heading-main">
          <h1 className="itinerary-week__title">
            {title}
          </h1>

          <p className="itinerary-week__date-range">
            {dateRange}
          </p>
        </div>
      </div>

      <div className="itinerary-week__legend">
        {ITINERARY_CATEGORIES.map(
          (category) => (
            <div
              className="itinerary-week__legend-item"
              key={
                category.key
              }
            >
              <span
                className={`itinerary-week__legend-color itinerary-week__legend-color--${category.key}`}
                aria-hidden="true"
              />

              <span>
                {category.name}
              </span>
            </div>
          ),
        )}
      </div>

      <div className="itinerary-week__layout">
        <div className="itinerary-week__calendar-shell">
          <button
            className="itinerary-week__week-nav itinerary-week__week-nav--previous"
            type="button"
            onClick={
              onPreviousWeek
            }
            disabled={
              !canGoPrevious ||
              isDeletingItem
            }
            aria-label="Previous week"
          >
            <ChevronLeftIcon />
          </button>

          <button
            className="itinerary-week__week-nav itinerary-week__week-nav--next"
            type="button"
            onClick={
              onNextWeek
            }
            disabled={
              !canGoNext ||
              isDeletingItem
            }
            aria-label="Next week"
          >
            <ChevronRightIcon />
          </button>

          <div
            ref={
              calendarScrollRef
            }
            className="itinerary-week__calendar-scroll"
          >
            <div
              className="itinerary-week__calendar"
              style={{
                '--itinerary-day-count':
                  days.length,
              }}
            >
              <div className="itinerary-week__header-spacer" />

              {days.map(
                (day) => {
                  const dayItems =
                    itemsByDate.get(
                      day.dateValue,
                    ) ?? []

                  const hasScheduledActivity =
                    dayItems.some(
                      (item) =>
                        getItemTimeRange(
                          item,
                        ) !== null,
                    )

                  return (
                    <div
                      className="itinerary-week__day-header"
                      key={
                        day.dateValue
                      }
                    >
                      <span className="itinerary-week__day-name">
                        {
                          day.weekday
                        }
                      </span>

                      <div className="itinerary-week__day-date-row">
                        <strong className="itinerary-week__day-date">
                          {
                            day.shortDate
                          }
                        </strong>

                        {hasScheduledActivity && (
                          <span
                            className="itinerary-week__day-indicator"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>
                  )
                },
              )}

              <div className="itinerary-week__timeline">
                <div className="itinerary-week__hours">
                  {HOURS.map(
                    (hour) => (
                      <span
                        className="itinerary-week__hour-label"
                        key={
                          hour
                        }
                        style={{
                          top: `${
                            hour *
                            ITINERARY_HOUR_HEIGHT
                          }px`,
                        }}
                      >
                        {String(
                          hour,
                        ).padStart(
                          2,
                          '0',
                        )}
                        :00
                      </span>
                    ),
                  )}
                </div>

                {days.map(
                  (day) => {
                    const dayItems =
                      itemsByDate.get(
                        day.dateValue,
                      ) ?? []

                    const laidOutItems =
                      layoutDayItems(
                        dayItems,
                      )

                    return (
                      <div
                        className="itinerary-week__day-column"
                        key={
                          day.dateValue
                        }
                      >
                        {HOURS.map(
                          (
                            hour,
                          ) => (
                            <span
                              className="itinerary-week__hour-line"
                              key={
                                hour
                              }
                              style={{
                                top: `${
                                  hour *
                                  ITINERARY_HOUR_HEIGHT
                                }px`,
                              }}
                              aria-hidden="true"
                            />
                          ),
                        )}

                        {laidOutItems.map(
                          (item) => (
                            <ItineraryEventCard
                              key={
                                item.id
                              }
                              item={
                                item
                              }
                              isSelected={
                                selectedItemId ===
                                item.id
                              }
                              isConfirmingDelete={
                                deleteConfirmationItemId ===
                                item.id
                              }
                              isDeleting={
                                isDeletingItem
                              }
                              deleteError={
                                deleteConfirmationItemId ===
                                  item.id &&
                                hasDeleteAttempted
                                  ? actionError
                                  : ''
                              }
                              onToggleSelected={
                                handleToggleSelected
                              }
                              onEdit={
                                onEditItem
                              }
                              onMoveToPlanLater={
                                onMoveItemToPlanLater
                              }
                              onStartDelete={
                                handleStartDeleting
                              }
                              onCancelDelete={
                                handleCancelDeleting
                              }
                              onConfirmDelete={
                                handleConfirmDeleting
                              }
                            />
                          ),
                        )}
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="itinerary-week__unscheduled">
          <div className="itinerary-week__unscheduled-header">
            <p className="itinerary-week__unscheduled-eyebrow">
              UNSCHEDULED
            </p>

            <h2>
              Plan later
            </h2>

            <p>
              Items without a time
              stay here until you
              schedule them.
            </p>
          </div>

          <div className="itinerary-week__unscheduled-list">
            {unscheduledItems.length ===
            0 ? (
              <p className="itinerary-week__unscheduled-empty">
                Nothing waiting to
                be scheduled.
              </p>
            ) : (
              unscheduledItems.map(
                (item) => (
                  <UnscheduledItemCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    isSelected={
                      selectedItemId ===
                      item.id
                    }
                    isConfirmingDelete={
                      deleteConfirmationItemId ===
                      item.id
                    }
                    isDeleting={
                      isDeletingItem
                    }
                    deleteError={
                      deleteConfirmationItemId ===
                        item.id &&
                      hasDeleteAttempted
                        ? actionError
                        : ''
                    }
                    onToggleSelected={
                      handleToggleSelected
                    }
                    onEdit={
                      onEditItem
                    }
                    onStartDelete={
                      handleStartDeleting
                    }
                    onCancelDelete={
                      handleCancelDeleting
                    }
                    onConfirmDelete={
                      handleConfirmDeleting
                    }
                  />
                ),
              )
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

export default ItineraryWeekView