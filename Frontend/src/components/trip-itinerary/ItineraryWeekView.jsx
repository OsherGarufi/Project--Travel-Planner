import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import '../../css/components/itinerary-week-view.css'
import {
  useItineraryDrag,
} from '../../hooks/trip-itinerary/useItineraryDrag'
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

function getActionPosition(
  event,
  boundarySelector,
) {
  const cardRect =
    event.currentTarget
      .getBoundingClientRect()

  const boundaryRect =
    event.currentTarget
      .closest(
        boundarySelector,
      )
      ?.getBoundingClientRect()

  const boundaryCenter =
    boundaryRect
      ? (
          boundaryRect.left +
          boundaryRect.right
        ) / 2
      : window.innerWidth / 2

  return {
    x:
      event.clientX -
      cardRect.left,

    y:
      event.clientY -
      cardRect.top + 6,

    alignEnd:
      event.clientX >
      boundaryCenter,
  }
}

function getActionPopupStyle(
  actionPosition,
) {
  if (!actionPosition) {
    return undefined
  }

  return {
    top:
      `${actionPosition.y}px`,

    left:
      `${actionPosition.x}px`,

    right: 'auto',

    transform:
      actionPosition.alignEnd
        ? 'translateX(-100%)'
        : 'none',
  }
}

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
  actionPosition,
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
      style={
        getActionPopupStyle(
          actionPosition,
        )
      }
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
  isDragging,
  actionPosition,
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onPointerDown,
  shouldSuppressClick,
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

  const handleClick =
    (event) => {
      event.stopPropagation()

      if (
        shouldSuppressClick?.()
      ) {
        event.preventDefault()
      }
    }

  const handleDoubleClick =
    (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (
        shouldSuppressClick?.()
      ) {
        return
      }

      onToggleSelected(
        item.id,
        getActionPosition(
          event,
          '.itinerary-week__calendar-shell',
        ),
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

  const className = [
    'itinerary-week__event',
    `itinerary-week__event--${categoryKey}`,
    isSelected
      ? 'itinerary-week__event--selected'
      : '',
    isDragging
      ? 'itinerary-week__event--dragging'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={
        className
      }
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPercentage}% + 4px)`,
        width: `calc(${widthPercentage}% - 8px)`,
        cursor:
          isDragging
            ? 'grabbing'
            : 'grab',
        opacity:
          isDragging
            ? 0.82
            : 1,
      }}
      tabIndex={0}
      aria-grabbed={
        isDragging
      }
      aria-label={`${item.title}, ${formatTime(
        item.startTime,
      )} to ${formatTime(
        item.endTime,
      )}. Drag to reschedule or double click for actions.`}
      onPointerDown={
        onPointerDown
      }
      onClick={
        handleClick
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
        !isDragging &&
        (
          isConfirmingDelete
            ? (
                <ItineraryDeleteConfirmation
                  item={
                    item
                  }
                  actionPosition={
                    actionPosition
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
                  style={
                    getActionPopupStyle(
                      actionPosition,
                    )
                  }
                  onEdit={() =>
                    onEdit?.(
                      item,
                    )
                  }
                  onMoveToPlanLater={
                    async () => {
                      const movedItem =
                        await onMoveToPlanLater?.(
                          item,
                        )

                      if (!movedItem) {
                        return
                      }

                      onToggleSelected(
                        item.id,
                      )
                    }
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
  isDragging,
  actionPosition,
  isConfirmingDelete,
  isDeleting,
  deleteError,
  onPointerDown,
  shouldSuppressClick,
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

  const handleClick =
    (event) => {
      event.stopPropagation()

      if (
        shouldSuppressClick?.()
      ) {
        event.preventDefault()
      }
    }

  const handleDoubleClick =
    (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (
        shouldSuppressClick?.()
      ) {
        return
      }

      onToggleSelected(
        item.id,
        getActionPosition(
          event,
          '.itinerary-week__unscheduled',
        ),
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

  const className = [
    'itinerary-week__unscheduled-card',
    `itinerary-week__unscheduled-card--${categoryKey}`,
    isSelected
      ? 'itinerary-week__unscheduled-card--selected'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={
        className
      }
      style={{
        cursor:
          isDragging
            ? 'grabbing'
            : 'grab',

        opacity:
          isDragging
            ? 0.82
            : 1,
      }}
      tabIndex={0}
      aria-grabbed={
        isDragging
      }
      aria-label={`${item.title}. Drag to schedule or double click for actions.`}
      onPointerDown={
        onPointerDown
      }
      onClick={
        handleClick
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
        !isDragging &&
        (
          isConfirmingDelete
            ? (
                <ItineraryDeleteConfirmation
                  item={
                    item
                  }
                  actionPosition={
                    actionPosition
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
                  style={
                    getActionPopupStyle(
                      actionPosition,
                    )
                  }
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
  onScheduleItemDrop,
  onDeleteItem,
  isDeletingItem,
  actionError,
}) {
  const calendarScrollRef =
    useRef(null)

  const unscheduledDropRef =
    useRef(null)

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState(null)

  const [
    selectedActionPosition,
    setSelectedActionPosition,
  ] = useState(null)

  const [
    deleteConfirmationItemId,
    setDeleteConfirmationItemId,
  ] = useState(null)

  const [
    hasDeleteAttempted,
    setHasDeleteAttempted,
  ] = useState(false)

  const closeItemActions =
    () => {
      setSelectedItemId(null)

      setSelectedActionPosition(
        null,
      )

      setDeleteConfirmationItemId(
        null,
      )

      setHasDeleteAttempted(false)
    }

  const {
    dragPreview,
    draggingItemId,
    startDrag,
    shouldSuppressClick,
  } = useItineraryDrag({
    calendarScrollRef,
    unscheduledDropRef,

    onDragStart:
      closeItemActions,

    onDrop:
      onScheduleItemDrop,
  })

  const displayedItineraryItems =
    useMemo(() => {
      if (!dragPreview) {
        return itineraryItems
      }

      return itineraryItems.map(
        (item) => {
          if (
            item.id !==
            dragPreview.itemId
          ) {
            return item
          }

          return {
            ...item,

            itineraryDate:
              dragPreview.itineraryDate,

            startTime:
              dragPreview.startTime,

            endTime:
              dragPreview.endTime,
          }
        },
      )
    }, [
      itineraryItems,
      dragPreview,
    ])

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

    setSelectedActionPosition(
      null,
    )

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

        setSelectedActionPosition(
          null,
        )

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

      displayedItineraryItems.forEach(
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
      displayedItineraryItems,
      visibleDateValues,
    ])

  const unscheduledItems =
    useMemo(
      () =>
        displayedItineraryItems.filter(
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
        displayedItineraryItems,
        visibleDateValues,
      ],
    )

  const handleToggleSelected =
    (
      itemId,
      actionPosition = null,
    ) => {
      if (
        isDeletingItem
      ) {
        return
      }

      const isClosing =
        selectedItemId ===
        itemId

      setSelectedItemId(
        isClosing
          ? null
          : itemId,
      )

      setSelectedActionPosition(
        isClosing
          ? null
          : actionPosition,
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

      setSelectedActionPosition(
        null,
      )

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

                    const isDragTarget =
                      dragPreview
                        ?.targetType ===
                        'calendar' &&
                      dragPreview
                        .itineraryDate ===
                        day.dateValue

                    return (
                      <div
                        className="itinerary-week__day-column"
                        data-itinerary-date={
                          day.dateValue
                        }
                        key={
                          day.dateValue
                        }
                        style={{
                          boxShadow:
                            isDragTarget
                              ? 'inset 0 0 0 2px var(--tp-color-primary-400)'
                              : undefined,
                        }}
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
                              isDragging={
                                draggingItemId ===
                                item.id
                              }
                              actionPosition={
                                selectedItemId ===
                                item.id
                                  ? selectedActionPosition
                                  : null
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
                              onPointerDown={
                                (
                                  event,
                                ) =>
                                  startDrag(
                                    event,
                                    item,
                                  )
                              }
                              shouldSuppressClick={
                                shouldSuppressClick
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

        <aside
          ref={
            unscheduledDropRef
          }
          className="itinerary-week__unscheduled"
          style={{
            boxShadow:
              dragPreview
                ?.targetType ===
                'unscheduled'
                ? '0 0 0 2px var(--tp-color-primary-400), 0 10px 30px rgba(30, 65, 103, 0.08)'
                : undefined,
          }}
        >
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
                    isDragging={
                      draggingItemId ===
                      item.id
                    }
                    actionPosition={
                      selectedItemId ===
                      item.id
                        ? selectedActionPosition
                        : null
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
                    onPointerDown={
                      (
                        event,
                      ) =>
                        startDrag(
                          event,
                          item,
                        )
                    }
                    shouldSuppressClick={
                      shouldSuppressClick
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